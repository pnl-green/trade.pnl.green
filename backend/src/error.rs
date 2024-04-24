use actix_web::{http::StatusCode, HttpResponse, ResponseError};
use thiserror::Error;

use crate::model::Response;

#[derive(Debug, Error)]
pub enum Error {
    #[error("IO Error: {0:?}")]
    IOError(std::io::Error),
    #[error("{0:?}")]
    BadRequestError(String),
    #[error(transparent)]
    UnexpectedError(#[from] anyhow::Error),
}

impl From<std::io::Error> for Error {
    fn from(err: std::io::Error) -> Self {
        Self::IOError(err)
    }
}

impl ResponseError for Error {
    fn status_code(&self) -> StatusCode {
        match self {
            Self::BadRequestError(_) => StatusCode::BAD_REQUEST,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

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
