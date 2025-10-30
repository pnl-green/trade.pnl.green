//! Common aliases and imports used across the backend.

use crate::error::Error;

/// Shorthand result type leveraging the backend's shared [`Error`] enum.
pub type Result<T> = std::result::Result<T, Error>;
