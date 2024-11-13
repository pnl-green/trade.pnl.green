use std::collections::HashMap;
use std::sync::Arc;

use anyhow::Context;
use futures_util::{SinkExt, StreamExt};
use tokio::sync::mpsc;
use tokio::sync::oneshot;
use tokio::sync::watch;

use crate::model::hyperliquid::{Subscribe, Subscription, WSMethod, WSResponse};
use crate::prelude::Result;
use lazy_static::lazy_static;
use tokio::net::TcpStream;
use tokio::sync::Mutex;
use tokio_tungstenite::tungstenite::Message;
use tokio_tungstenite::MaybeTlsStream;
use tokio_tungstenite::WebSocketStream;
use tracing::{error, warn};

lazy_static! {
    pub static ref WSMAP: Arc<Mutex<HashMap<usize, WSSubscriptions>>> =
        Arc::new(Mutex::new(HashMap::new()));
}
pub type StreamSender = mpsc::Sender<(
    Subscription,
    ResponsePattern,
    oneshot::Receiver<()>,
    watch::Sender<Option<WSResponse>>,
)>;

pub type StreamReceiver = mpsc::Receiver<(
    Subscription,
    ResponsePattern,
    oneshot::Receiver<()>,
    watch::Sender<Option<WSResponse>>,
)>;
pub struct WSSubscriptions {
    pub stream: Arc<Mutex<WebSocketStream<MaybeTlsStream<TcpStream>>>>,
    pub subscriptions_count: u16,
    pub sender: StreamSender,
}

pub async fn find_free_websocket() -> Result<usize> {
    let mut wsm = WSMAP.lock().await;

    for (&key, ws_subs) in wsm.iter_mut() {
        if ws_subs.subscriptions_count < 1000 {
            return Ok(key);
        }
    }

    let (stream, _response) = tokio_tungstenite::connect_async("wss://api.hyperliquid.xyz/ws")
        .await
        .context("Failed to connect to the HyperLiquid WS")?;

    let (stream_sender, stream_reciver) = tokio::sync::mpsc::channel::<(
        Subscription,
        ResponsePattern,
        oneshot::Receiver<()>,
        watch::Sender<Option<WSResponse>>,
    )>(1);

    let new_key = wsm.len() + 1;
    wsm.insert(
        new_key,
        WSSubscriptions {
            stream: Arc::new(Mutex::new(stream)),
            subscriptions_count: 1,
            sender: stream_sender,
        },
    );

    drop(wsm);

    tokio::spawn(async move {
        if let Err(err) = stream_recv(new_key, stream_reciver).await {
            error!("Price receiver exited:{}", err);
        }
    });

    Ok(new_key)
}

async fn stream_recv(new_key: usize, mut recv_subs: StreamReceiver) -> Result<()> {
    let mut subscription_map: HashMap<ResponsePattern, watch::Sender<Option<WSResponse>>> =
        HashMap::new();
    let mut unsubscription_list: Vec<(oneshot::Receiver<()>, WSMethod)> = Vec::new();

    let wsm = WSMAP.lock().await;
    let ws_subscription = wsm.get(&new_key).unwrap();
    let ws_stream = ws_subscription.stream.clone();

    drop(wsm);

    while let Some(msg) = ws_stream.lock().await.next().await {
        let Ok(msg) = msg else {
            warn!("Failed to extract message from the stream");
            continue;
        };
        let Ok(data) = msg.into_text() else {
            warn!("Incoming message isn't text from the stream");
            continue;
        };

        let msg = match serde_json::from_str::<WSResponse>(&data) {
            Ok(msg) => msg,
            Err(e) => {
                warn!("Failed to parse message response from WS: {e} - {data}");
                continue;
            }
        };
        let msg_resp_patrn = ResponsePattern::from(&msg);

        if let Some((sub, response_pattern, stop_reciver, sender)) = recv_subs.recv().await {
            let method = WSMethod::Subscribe(sub.clone());
            let payload = serde_json::to_string(&method)
                .context("Failed to serialize subscription payload")?;
            ws_stream
                .lock()
                .await
                .send(Message::Text(payload))
                .await
                .context("Failed to subscribe to desired coin price")?;
            subscription_map.insert(response_pattern, sender);

            unsubscription_list.push((stop_reciver, WSMethod::Unsubscribe(sub)));
        }
        if let Some(sender) = subscription_map.get(&msg_resp_patrn) {
            sender
                .send(Some(msg))
                .context("Failed sending price to the receiver")?;
        }

        for (stop_reciver, method) in unsubscription_list.iter_mut() {
            if stop_reciver.try_recv().is_ok() {
                let payload = serde_json::to_string(&method)
                    .context("Failed to serialize unsubscription payload")?;
                ws_stream
                    .lock()
                    .await
                    .send(Message::Text(payload))
                    .await
                    .context("Failed to unsubscribe to desired coin price")?;

                let mut wsm = WSMAP.lock().await;
                let ws_stream = wsm.get_mut(&new_key).unwrap();
                ws_stream.subscriptions_count -= 1;
            }
        }
    }
    Ok(())
}

#[derive(Eq, Hash, PartialEq)]
pub enum ResponsePattern {
    L2Book(String),
    Candle(String),
    SubscriptionResponse(String),
}

impl From<&WSResponse> for ResponsePattern {
    fn from(value: &WSResponse) -> ResponsePattern {
        match value {
            WSResponse::L2Book(price) => ResponsePattern::L2Book(price.coin.clone()),
            WSResponse::Candle(candle) => ResponsePattern::Candle(candle.symbol.clone()),
            WSResponse::SubscriptionResponse(subscription) => match &subscription.subscription {
                Subscribe::Candle { coin, interval: _ } => {
                    ResponsePattern::SubscriptionResponse(coin.clone())
                }
                Subscribe::L2Book { coin } => ResponsePattern::SubscriptionResponse(coin.clone()),
            },
        }
    }
}

pub struct BookPrice;

impl BookPrice {
    pub async fn init(
        symbol: &str,
    ) -> anyhow::Result<(watch::Receiver<Option<WSResponse>>, oneshot::Sender<()>)> {
        let (sender, receiver) = tokio::sync::watch::channel::<Option<WSResponse>>(None);
        let (stop_sender, stop_reciver) = tokio::sync::oneshot::channel::<()>();

        let topic = Subscribe::L2Book {
            coin: symbol.to_string(),
        };
        let subscription = Subscription::new(topic.clone());

        let response = ResponsePattern::L2Book(symbol.to_string());

        let ws_key = find_free_websocket().await?;
        let mut wsm = WSMAP.lock().await;
        let ws_stream = wsm.get_mut(&ws_key).unwrap();
        ws_stream
            .sender
            .send((subscription, response, stop_reciver, sender))
            .await?;

        Ok((receiver, stop_sender))
    }
}
