//! Helpers for configuring tracing so the backend emits consistent structured logs.
//!
//! The [`subscriber`] module exposes constructors that the binary can use to
//! install a Bunyan-style subscriber with environment-based filtering.

mod subscriber;

pub use subscriber::{get_subscriber, init_subscriber};
