use crate::{prelude::Result, ws::hyperliquid::pairs_candle::PairsCandle};
use anyhow::Context;
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use tokio::net::TcpStream;
use tokio_tungstenite::{tungstenite::Message, WebSocketStream};
use tracing::{debug, error, info, warn};

/// Describes the supported client-initiated websocket requests.
///
/// Actix routes the raw websocket upgrade into [`handler`], which then
/// deserializes the inbound JSON frame into one of these variants to dispatch
/// downstream stream logic.
#[derive(Debug, Deserialize)]
#[serde(tag = "method", content = "data", rename_all = "snake_case")]
pub enum WSRequest {
    /// Client wants a candle ratio stream for the given base/quote symbols.
    PairsCandle {
        symbol_left: String,
        symbol_right: String,
    },
    /// Client wants the order book depth stream for a single symbol.
    Price { symbol: String },
}
// { "method": "pairs_candle", "data": { "symbol_left": "BTC", "symbol_right": "ETH" } }

/// Accept a websocket upgrade and forward supported subscription requests to
/// their dedicated handlers.
///
/// The function keeps a single client connection alive, continuously reading
/// JSON frames. When a recognized request arrives we spin up the associated
/// stream producer (e.g. [`pairs_candle_handler`]) and pipe its updates back to
/// the client.
pub async fn handler(stream: TcpStream) -> Result<()> {
    // Finalize the websocket handshake before starting our control loop.
    let mut stream = tokio_tungstenite::accept_async(stream)
        .await
        .context("Failed accepting WS connection")?;

    while let Some(msg) = stream.next().await {
        // Surface connection-level errors but keep the loop running for
        // transient tungstenite issues.
        let Ok(msg) = msg else {
            warn!("Failed to extract message from the WS client stream");
            continue;
        };
        let Ok(data) = msg.into_text() else {
            debug!("Client sent invalid non-text data");
            continue;
        };

        let msg = match serde_json::from_str::<WSRequest>(&data) {
            Ok(msg) => msg,
            Err(e) => {
                warn!("Failed to parse incoming message from WS client: {e} - {data}");
                continue;
            }
        };

        match msg {
            WSRequest::PairsCandle {
                symbol_left,
                symbol_right,
            } => {
                pairs_candle_handler(&mut stream, &symbol_left, &symbol_right).await?;
            }
            // Price streaming is currently handled directly by `BookPrice` via
            // the shared map; we ignore these messages until the API exposes
            // the handler to clients.
            WSRequest::Price { symbol: _ } => {}
        }
    }

    Ok(())
}

/// Stream Hyperliquid candle updates for a pair of coins back to the client.
///
/// The helper spawns the [`PairsCandle`] worker to multiplex two candle feeds
/// into a paired ratio. We forward the resulting snapshots over the websocket
/// connection while propagating serialization or IO failures back to Actix.
pub async fn pairs_candle_handler(
    stream: &mut WebSocketStream<TcpStream>,
    symbol_left: &str,
    symbol_right: &str,
) -> Result<()> {
    let (pairs, mut receiver) = PairsCandle::new(symbol_left, symbol_right);

    tokio::spawn(async move {
        // Keep the websocket worker alive on a detached task so we can await
        // updates on this thread while surfacing background failures via logs.
        if let Err(err) = pairs.receive_candle().await {
            error!("Candle receiver exited: {err}");
        }
    });

    while let Some(candle) = receiver.recv().await {
        let msg = serde_json::to_string(&candle).context("Failed serializing candle data")?;
        stream
            .send(Message::text(msg))
            .await
            .context("Failed sending the candle data to the client")?;
    }
    info!("Stopped sending pairs candle data");

    Ok(())
}
