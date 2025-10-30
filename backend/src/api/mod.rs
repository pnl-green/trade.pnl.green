//! HTTP handlers exposed by the Actix application.
//!
//! Each submodule groups routes by concern (status checks, Hyperliquid API,
//! etc.) and re-exports their handlers for the router configuration in
//! `main.rs`.

mod hyperliquid;
mod not_found;
mod status;

pub use hyperliquid::hyperliquid;
pub use not_found::not_found;
pub use status::status;
