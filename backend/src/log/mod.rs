//! Helpers for configuring tracing so the backend emits consistent structured logs.
//!
//! The [`subscriber`] module exposes constructors that the binary can use to
//! install a Bunyan-style subscriber with environment-based filtering.

mod subscriber;

// Re-export the subscriber helpers so binaries can call `log::init_subscriber`
// directly without needing to know the module layout of this crate.
pub use subscriber::{get_subscriber, init_subscriber};
