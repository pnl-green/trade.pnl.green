//! Hyperliquid-specific websocket helpers.
//!
//! Each submodule encapsulates the orchestration required to subscribe to
//! Hyperliquid feeds and funnel updates into the backend's websocket sessions,
//! keeping shared state (like socket pools) local to the functionality that
//! needs it.

pub mod book_price;
pub mod pairs_candle;
