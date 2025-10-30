//! Websocket entrypoints exposed by the backend.
//!
//! The `ws` module provides thin routing modules that wire incoming upgrade
//! requests to concrete Hyperliquid stream handlers. Each submodule focuses on
//! coordinating a specific set of subscriptions or socket behaviours.

pub mod handler;
pub mod hyperliquid;
