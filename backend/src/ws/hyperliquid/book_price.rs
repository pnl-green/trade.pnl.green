//! Shared websocket infrastructure for streaming Hyperliquid book and candle
//! updates.
//!
//! This module multiplexes a limited number of long-lived Hyperliquid socket
//! connections across subscribers. It tracks which response patterns belong to
//! each client, forwards updates via `watch` channels, and exposes helpers to
//! acquire a connection that has spare capacity.

use crate::model::hyperliquid::{Subscribe, Subscription, WSMethod, WSResponse};
use crate::prelude::Result;
use anyhow::Context;
use futures_util::{SinkExt, StreamExt};
use lazy_static::lazy_static;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::net::TcpStream;
use tokio::sync::oneshot;
use tokio::sync::watch;
use tokio::sync::Mutex;
use tokio::sync::{mpsc, RwLock};
use tokio_tungstenite::tungstenite::Message;
use tokio_tungstenite::MaybeTlsStream;
use tokio_tungstenite::WebSocketStream;
use tracing::{error, warn};

lazy_static! {
    /// Registry tracking active Hyperliquid websocket connections and their
    /// subscription load.
    pub static ref WSMAP: Arc<Mutex<HashMap<usize, WSSubscriptions>>> =
        Arc::new(Mutex::new(HashMap::new()));
}
/// Channel used to push subscription requests at the websocket task.
pub type StreamSender = mpsc::Sender<(
    Subscription,
    ResponsePattern,
    oneshot::Receiver<()>,
    watch::Sender<Option<WSResponse>>,
)>;

/// Receiver counterpart yielding subscription instructions for execution.
pub type StreamReceiver = mpsc::Receiver<(
    Subscription,
    ResponsePattern,
    oneshot::Receiver<()>,
    watch::Sender<Option<WSResponse>>,
)>;
/// Metadata associated with an established websocket connection.
pub struct WSSubscriptions {
    /// Number of active subscriptions currently pinned to the socket.
    pub subscriptions_count: u16,
    /// Channel to request additional subscription/unsubscription operations.
    pub sender: StreamSender,
}

/// Find an existing websocket with spare capacity or create a new one.
///
/// The Hyperliquid API tolerates up to roughly 1k subscriptions per socket, so
/// we reuse connections until they fill up. New sockets spawn a background task
/// that listens for responses and fans them out to interested consumers.
pub async fn find_free_websocket() -> Result<usize> {
    let mut wsm = WSMAP.lock().await;

    for (&key, ws_subs) in wsm.iter_mut() {
        if ws_subs.subscriptions_count < 1000 {
            ws_subs.subscriptions_count += 1;
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
    )>(16);

    let new_key = wsm.len() + 1;
    wsm.insert(
        new_key,
        WSSubscriptions {
            subscriptions_count: 1,
            sender: stream_sender,
        },
    );

    drop(wsm);

    tokio::spawn(async move {
        if let Err(err) = stream_recv(stream, new_key, stream_reciver).await {
            error!("Price receiver exited:{}", err);
        }
    });

    Ok(new_key)
}

/// Drive a websocket connection by subscribing/unsubscribing and routing
/// incoming frames to interested listeners.
async fn stream_recv(
    stream: WebSocketStream<MaybeTlsStream<TcpStream>>,
    new_key: usize,
    mut recv_subs: StreamReceiver,
) -> Result<()> {
    let subscription_map: Arc<RwLock<HashMap<ResponsePattern, watch::Sender<Option<WSResponse>>>>> =
        Arc::default();
    let mut unsubscription_list: Vec<(oneshot::Receiver<()>, WSMethod, ResponsePattern)> =
        Vec::new();
    let subscription_map_2 = subscription_map.clone();
    let (mut writer, mut reader) = stream.split();
    // Reader task: decode every server frame and notify the matching
    // subscriber if we have someone waiting on that response pattern.
    tokio::spawn(async move {
        while let Some(msg) = reader.next().await {
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

            if let Some(sender) = subscription_map.read().await.get(&msg_resp_patrn) {
                sender
                    .send(Some(msg))
                    .context("Failed sending price to the receiver")
                    .unwrap();
            }
        }
        error!("Price receiver stopped");
    });
    loop {
        // Pick up new subscription requests pushed in by `find_free_websocket`.
        if let Ok((sub, response_pattern, stop_reciver, sender)) = recv_subs.try_recv() {
            let method = WSMethod::Subscribe(sub.clone());
            let payload = serde_json::to_string(&method)
                .context("Failed to serialize subscription payload")?;
            writer
                .send(Message::Text(payload))
                .await
                .context("Failed to subscribe to desired coin price")?;
            subscription_map_2
                .write()
                .await
                .insert(response_pattern.clone(), sender);

            unsubscription_list.push((stop_reciver, WSMethod::Unsubscribe(sub), response_pattern));
        }

        let mut i = 0;
        while i < unsubscription_list.len() {
            let (stop_reciver, method, response_pattern) = &mut unsubscription_list[i];

            if stop_reciver.try_recv().is_ok() {
                // Client signalled that it no longer needs updates; tear down the
                // remote subscription and free a slot on the shared socket.
                let payload = serde_json::to_string(&method)
                    .context("Failed to serialize unsubscription payload")?;
                writer
                    .send(Message::Text(payload))
                    .await
                    .context("Failed to unsubscribe to desired coin price")?;

                let mut wsm = WSMAP.lock().await;
                let ws_stream = wsm.get_mut(&new_key).unwrap();
                subscription_map_2.write().await.remove(response_pattern);

                ws_stream.subscriptions_count -= 1;

                unsubscription_list.remove(i);
            } else {
                i += 1;
            }
        }

        tokio::time::sleep(std::time::Duration::from_millis(10)).await;
    }
}

/// Key describing which subscribers should receive a response.
#[derive(Eq, Hash, PartialEq, Clone)]
pub enum ResponsePattern {
    L2Book(String),
    Candle(String),
    SubscriptionResponse(String),
}

impl From<&WSResponse> for ResponsePattern {
    /// Deduce the pattern key that will wake any listeners awaiting this
    /// response.
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

/// Access point for consumers that need a live Hyperliquid L2 book stream.
pub struct BookPrice;

impl BookPrice {
    /// Ensure a connection streaming the requested L2 book exists and return a
    /// watcher that yields updates until the provided stop signal is fired.
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
