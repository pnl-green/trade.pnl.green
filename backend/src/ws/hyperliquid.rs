use std::collections::HashMap;
use std::sync::Arc;

use anyhow::Context;
use futures_util::{SinkExt, StreamExt};
use tokio::net::TcpStream;
use tokio::sync::mpsc;

use crate::model::hyperliquid::{Candle, L2Book, Subscribe, Subscription, WSMethod, WSResponse};
use crate::prelude::Result;
use lazy_static::lazy_static;
use tokio::sync::Mutex;
use tokio_tungstenite::tungstenite::Message;
use tokio_tungstenite::MaybeTlsStream;
use tokio_tungstenite::WebSocketStream;
use tracing::{error, info, warn};

lazy_static! {
    pub static ref WSMAP: Arc<Mutex<HashMap<usize, WSSubscriptions>>> =
        Arc::new(Mutex::new(HashMap::new()));
}
pub struct WSSubscriptions {
    pub stream: WebSocketStream<MaybeTlsStream<TcpStream>>,
    pub subscriptions_count: u16,
}

pub async fn find_free_websocket() -> Result<usize> {
    let mut wsm = WSMAP.lock().await;

    for (&key, ws_subs) in wsm.iter_mut() {
        if ws_subs.subscriptions_count < 1000 {
            return Ok(key);
        }
    }

    let new_key = wsm.len() + 1;
    let stream = create_websocket_stream().await?;

    wsm.insert(
        new_key,
        WSSubscriptions {
            stream,
            subscriptions_count: 1,
        },
    );
    Ok(new_key)
}

async fn create_websocket_stream() -> Result<WebSocketStream<MaybeTlsStream<TcpStream>>> {
    let (stream, _response) = tokio_tungstenite::connect_async("wss://api.hyperliquid.xyz/ws")
        .await
        .context("Failed to connect to the HyperLiquid WS")?;
    Ok(stream)
}

pub struct PairsCandle {
    sender: mpsc::Sender<Candle>,
    symbol_left: String,
    symbol_right: String,
}

impl PairsCandle {
    pub fn new(symbol_left: &str, symbol_right: &str) -> (Self, mpsc::Receiver<Candle>) {
        let (sender, receiver) = tokio::sync::mpsc::channel::<Candle>(1);

        (
            Self {
                sender,
                symbol_left: symbol_left.into(),
                symbol_right: symbol_right.into(),
            },
            receiver,
        )
    }

    pub async fn receive_candle(&self) -> Result<()> {
        let Self {
            symbol_left,
            symbol_right,
            ..
        } = self;
        let topic = Subscribe::Candle {
            coin: symbol_left.into(),
            interval: "1h".into(),
        };
        let method_left = WSMethod::Subscribe(Subscription::new(topic));
        let topic = Subscribe::Candle {
            coin: symbol_right.into(),
            interval: "1h".into(),
        };

        let method_right = WSMethod::Subscribe(Subscription::new(topic));
        // { "method": "subscribe", "subscription": { "type": "candle", "coin": "SOL", "interval": "1h" } }
        let payload_left = serde_json::to_string(&method_left)
            .context("Failed to serialize subscription payload")?;
        let payload_right = serde_json::to_string(&method_right)
            .context("Failed to serialize subscription payload")?;

        let (mut stream, _response) =
            tokio_tungstenite::connect_async("wss://api.hyperliquid.xyz/ws")
                .await
                .context("Failed to connect to the HyperLiquid WS")?;
        info!("Receiving candle data for {symbol_left}/{symbol_right}");

        stream
            .send(Message::Text(payload_left))
            .await
            .context("Failed to subscribe to desired coin candle")?;
        stream
            .send(Message::Text(payload_right))
            .await
            .context("Failed to subscribe to desired coin candle")?;
        // TODO: add pings

        let mut symbol_left_candle = None;
        let mut symbol_right_candle = None;

        while let Some(msg) = stream.next().await {
            let Ok(msg) = msg else {
                warn!("Failed to extract message from the stream for {symbol_left}/{symbol_right}");
                continue;
            };
            let Ok(data) = msg.into_text() else {
                warn!(
                    "Incoming message isn't text from the stream for {symbol_left}/{symbol_right}"
                );
                continue;
            };

            let msg = match serde_json::from_str::<WSResponse>(&data) {
                Ok(msg) => msg,
                Err(e) => {
                    warn!("Failed to parse message response from WS: {e} - {data}");
                    continue;
                }
            };

            match msg {
                WSResponse::SubscriptionResponse(res) => {
                    info!("Subscribed to the stream for {:?}", res.subscription);
                }
                WSResponse::Candle(candle) => {
                    if &candle.symbol == symbol_left {
                        symbol_left_candle = Some(candle);
                    } else if &candle.symbol == symbol_right {
                        symbol_right_candle = Some(candle);
                    }

                    if let Some((left, right)) = symbol_left_candle
                        .as_ref()
                        .zip(symbol_right_candle.as_ref())
                    {
                        self.sender
                            .send(left.pair(right))
                            .await
                            .context("Failed sending paired candle to the receiver")?;
                    }
                }
                WSResponse::L2Book(price) => (),
            }
        }

        Ok(())
    }
}

pub struct BookPrice {
    sender: mpsc::Sender<L2Book>,
    symbol: String,
    stop_reciver: mpsc::Receiver<()>,
}

impl BookPrice {
    pub fn new(symbol: &str) -> (Self, mpsc::Receiver<L2Book>, mpsc::Sender<()>) {
        let (sender, receiver) = tokio::sync::mpsc::channel::<L2Book>(1);
        let (stop_sender, stop_reciver) = tokio::sync::mpsc::channel::<()>(1);
        (
            Self {
                sender,
                symbol: symbol.into(),
                stop_reciver,
            },
            receiver,
            stop_sender,
        )
    }

    pub async fn add_to_handler(
        symbol: &str,
    ) -> Result<(mpsc::Receiver<L2Book>, mpsc::Sender<()>)> {
        let (book_price, receiver, stop_sender) = BookPrice::new(symbol);

        tokio::spawn(async move {
            if let Err(err) = book_price.receive_price().await {
                error!("Price receiver exited:{}", err);
            }
        });

        Ok((receiver, stop_sender))
    }

    pub async fn receive_price(mut self) -> Result<()> {
        let Self { symbol, .. } = self;
        let topic = Subscribe::L2Book {
            coin: symbol.clone(),
        };
        let method = WSMethod::Subscribe(Subscription::new(topic.clone()));

        let payload =
            serde_json::to_string(&method).context("Failed to serialize subscription payload")?;

        let ws_key = find_free_websocket().await?;
        let mut wsm = WSMAP.lock().await;
        let ws_stream = wsm.get_mut(&ws_key).unwrap();

        info!("Receiving price data for {}", &symbol);

        ws_stream
            .stream
            .send(Message::Text(payload))
            .await
            .context("Failed to subscribe to desired coin price")?;
        ws_stream.subscriptions_count += 1;

        let mut symbol_price = None;

        while let Some(msg) = ws_stream.stream.next().await {
            let Ok(msg) = msg else {
                warn!("Failed to extract message from the stream for {symbol}");
                continue;
            };
            let Ok(data) = msg.into_text() else {
                warn!("Incoming message isn't text from the stream for {symbol}");
                continue;
            };

            let msg = match serde_json::from_str::<WSResponse>(&data) {
                Ok(msg) => msg,
                Err(e) => {
                    warn!("Failed to parse message response from WS: {e} - {data}");
                    continue;
                }
            };

            match msg {
                WSResponse::SubscriptionResponse(res) => {
                    info!("Subscribed to the stream for {:?}", res.subscription);
                }
                WSResponse::L2Book(price) => {
                    if price.coin == symbol {
                        symbol_price = Some(price);
                    }

                    if let Some(price) = symbol_price.as_ref() {
                        self.sender
                            .send(price.clone())
                            .await
                            .context("Failed sending price to the receiver")?;
                    }
                }
                WSResponse::Candle(candle) => (),
            }

            if self.stop_reciver.try_recv().is_ok() {
                let method = WSMethod::Unsubscribe(Subscription::new(topic));
                let payload = serde_json::to_string(&method)
                    .context("Failed to serialize unsubscription payload")?;
                ws_stream
                    .stream
                    .send(Message::Text(payload))
                    .await
                    .context("Failed to unsubscribe to desired coin price")?;
                ws_stream.subscriptions_count -= 1;
                break;
            }
        }

        Ok(())
    }
}
