pub mod response {
    use serde::Serialize;

    #[derive(Debug, Serialize)]
    pub struct Response<T: Serialize> {
        pub success: bool,
        #[serde(skip_serializing_if = "Option::is_none")]
        pub data: Option<T>,
        #[serde(skip_serializing_if = "Option::is_none")]
        pub msg: Option<String>,
    }
}
