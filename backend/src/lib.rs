//! Crate entry that exposes the backend modules Actix consumes from `main.rs` while keeping
//! internal structure discoverable for other binaries or integration tests.

mod config;

pub mod api;
pub mod error;
pub mod log;
pub mod model;
pub mod prelude;
pub mod service;
pub mod ws;

// Re-export the configuration helper so downstream binaries can bootstrap the same environment
// loading logic without having to reach into the private `config` module.
pub use config::Config;
