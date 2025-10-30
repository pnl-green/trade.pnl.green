//! Candle pairing helper that maintains a websocket connection for two coins
//! and emits combined price series for the frontend charts.

use crate::model::hyperliquid::{Candle, Subscribe, Subscription, WSMethod, WSResponse};
use crate::prelude::Result;
use anyhow::Context;
use futures_util::{SinkExt, StreamExt};
use tokio::sync::mpsc;
use tokio_tungstenite::tungstenite::Message;
use tracing::{info, warn};

/// Maintains a websocket session streaming two coin candles and relays paired
/// results over a channel.
pub struct PairsCandle {
    sender: mpsc::Sender<Candle>,
    symbol_left: String,
    symbol_right: String,
}

impl PairsCandle {
    /// Create a candle pairer alongside the channel consumer will read from.
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

    /// Subscribe to both candles and forward paired snapshots until the stream
    /// ends or an error occurs.
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
