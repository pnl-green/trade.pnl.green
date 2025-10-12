//! Shared data structures exchanged between the API, websocket, and service
//! layers.
//!
//! The module is intentionally small: the backend mostly relies on the
//! Hyperliquid SDK types, but we define a few wrappers to ensure serde naming
//! conventions and ergonomic re-exports for handlers.

mod api;

/// Hyperliquid-specific request and websocket payload models.
pub mod hyperliquid;

/// Canonical JSON response envelope returned by HTTP endpoints.
pub use api::response::Response;
