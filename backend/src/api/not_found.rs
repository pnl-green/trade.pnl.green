use actix_web::HttpResponse;

/// Catch-all handler used when no registered route matches the request.
///
/// Actix allows attaching this to the `default_service` so clients receive a
/// consistent 404 response body across the API surface.
pub async fn not_found() -> HttpResponse {
    HttpResponse::NotFound().body("Resource Not Found")
}
