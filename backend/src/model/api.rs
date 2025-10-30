//! Canonical HTTP response envelope shared across backend handlers.

pub mod response {
    use serde::Serialize;

    #[derive(Debug, Serialize)]
    pub struct Response<T: Serialize> {
        /// Whether the request succeeded.
        pub success: bool,
        /// Optional payload returned to the caller.
        #[serde(skip_serializing_if = "Option::is_none")]
        pub data: Option<T>,
        /// Optional human-readable error or status message.
        #[serde(skip_serializing_if = "Option::is_none")]
        pub msg: Option<String>,
    }
}
