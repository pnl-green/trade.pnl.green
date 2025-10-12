//! Service layer for interacting with external integrations.
//!
//! Each service module contains thin wrappers that translate backend requests
//! into SDK calls or other IO operations. The Hyperliquid service currently
//! covers REST/WS helper logic shared across the API and websocket handlers,
//! and should be the first stop when adding new exchange interactions.

pub mod hyperliquid;
