use actix_web::{http::StatusCode, HttpResponse, ResponseError};
use thiserror::Error;

use crate::model::Response;

/// Shared error type surfaced to Actix handlers. Centralising the variants here lets the service
/// layer use `?` with domain-specific issues while still returning typed API responses.
#[derive(Debug, Error)]
pub enum Error {
    #[error("IO Error: {0:?}")]
    IOError(std::io::Error),
    #[error("{0:?}")]
    BadRequestError(String),
    #[error("{0:?}")]
    FloatParsingFailed(#[from] std::num::ParseFloatError),
    #[error("{0:?}")]
    HyperliquidError(#[from] hyperliquid::Error),
    #[error(transparent)]
    UnexpectedError(#[from] anyhow::Error),
}

impl From<std::io::Error> for Error {
    fn from(err: std::io::Error) -> Self {
        Self::IOError(err)
    }
}

impl ResponseError for Error {
    /// Map each error variant to an HTTP status so transport-level semantics remain consistent.
    fn status_code(&self) -> StatusCode {
        match self {
            Self::BadRequestError(_) => StatusCode::BAD_REQUEST,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    /// Convert the error into the shared JSON envelope returned by the API layer.
    fn error_response(&self) -> HttpResponse {
        let mut builder = HttpResponse::build(self.status_code());

        let data = None::<String>;
        let success = false;

        match self {
            Self::BadRequestError(msg) => builder.json(Response {
                msg: Some(msg.into()),
                data,
                success,
            }),

            _ => builder.json(Response {
                msg: Some("Internal Server Error".into()),
                data,
                success,
            }),
        }
    }
}
