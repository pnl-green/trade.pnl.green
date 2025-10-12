use actix_web::HttpResponse;

/// Lightweight readiness probe used by orchestrators and uptime checks.
///
/// The handler intentionally performs no I/O; if the Actix server is running
/// and the handler executes, we return a simple JSON "OK" payload.
pub async fn status() -> HttpResponse {
    // Respond with a constant payload so the probe remains fast and side-effect
    // free.
    HttpResponse::Ok().json("OK")
}
