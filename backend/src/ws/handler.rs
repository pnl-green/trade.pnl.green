use crate::prelude::Result;
use anyhow::Context;
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use tokio::net::TcpStream;
use tokio_tungstenite::{tungstenite::Message, WebSocketStream};
use tracing::{debug, error, info, warn};

use super::hyperliquid::PairsCandle;

#[derive(Debug, Deserialize)]
#[serde(tag = "method", content = "data", rename_all = "snake_case")]
pub enum WSRequest {
    PairsCandle {
        symbol_left: String,
        symbol_right: String,
    },
}
// { "method": "pairs_candle", "data": { "symbol_left": "BTC", "symbol_right": "ETH" } }

pub async fn handler(stream: TcpStream) -> Result<()> {
    let mut stream = tokio_tungstenite::accept_async(stream)
        .await
        .context("Failed accepting WS connection")?;

    while let Some(msg) = stream.next().await {
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
        }
    }

    Ok(())
}

pub async fn pairs_candle_handler(
    stream: &mut WebSocketStream<TcpStream>,
    symbol_left: &str,
    symbol_right: &str,
) -> Result<()> {
    let (pairs, mut receiver) = PairsCandle::new(symbol_left, symbol_right);

    tokio::spawn(async move {
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
