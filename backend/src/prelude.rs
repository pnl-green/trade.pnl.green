//! Common aliases and imports used across the backend.
//!
//! Modules can import `crate::prelude::*` to pull in the shared [`Result`]
//! alias without having to repeat the backend-specific error type. Keeping the
//! prelude minimal reduces the risk of surprising wildcard imports while still
//! standardising error handling.

use crate::error::Error;

/// Shorthand result type leveraging the backend's shared [`Error`] enum.
pub type Result<T> = std::result::Result<T, Error>;
