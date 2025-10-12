//! Canonical HTTP response envelope shared across backend handlers.

pub mod response {
    //! Lightweight response envelope helpers shared by HTTP endpoints.
    //!
    //! The struct is intentionally generic so handlers can wrap any serialisable
    //! payload while still providing the uniform `{ success, data, msg }` shape
    //! expected by the frontend.
    use serde::Serialize;

    #[derive(Debug, Serialize)]
    /// Serialised response envelope returned by every REST endpoint.
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
