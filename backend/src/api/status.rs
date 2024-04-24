use actix_web::HttpResponse;

pub async fn status() -> HttpResponse {
    HttpResponse::Ok().json("OK")
}
