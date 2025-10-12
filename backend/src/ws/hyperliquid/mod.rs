//! Hyperliquid-specific websocket helpers.
//!
//! Each submodule encapsulates the orchestration required to subscribe to
//! Hyperliquid feeds and funnel updates into the backend's websocket sessions.

pub mod book_price;
pub mod pairs_candle;
