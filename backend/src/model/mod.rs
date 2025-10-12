//! Shared data structures exchanged between the API, websocket, and service
//! layers.
//!
//! The module is intentionally small: the backend mostly relies on the
//! Hyperliquid SDK types, but we define a few wrappers to ensure serde naming
//! conventions and ergonomic re-exports for handlers.
//!
//! When contributing new endpoints, prefer adding the request/response shapes
//! here so they can be shared by HTTP and websocket handlers alike. Keeping the
//! models colocated also helps enforce consistent serde casing rules across the
//! surface area.

mod api;

/// Hyperliquid-specific request and websocket payload models.
pub mod hyperliquid;

/// Canonical JSON response envelope returned by HTTP endpoints.
///
/// Re-exporting the type from this module keeps `use` blocks short for API
/// handlers, while still allowing the struct definition to live in the
/// dedicated [`model::api`] namespace alongside any future helpers.
pub use api::response::Response;
