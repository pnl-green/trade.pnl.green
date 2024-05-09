use std::{env, net::TcpListener};

use actix::spawn;
use actix_cors::Cors;
use actix_session::{storage::RedisSessionStore, SessionMiddleware};
use actix_web::{
    cookie::{Key, SameSite},
    http::header,
    web, App, HttpServer,
};
use anyhow::Context;
use backend::{api, log, model::hyperliquid::Exchange, Config};

use hyperliquid::types::Chain;
use tokio::sync::mpsc;
use tracing_actix_web::TracingLogger;

#[actix_web::main]
async fn main() -> anyhow::Result<()> {
    let config = Config::new()?;

    let subscriber = log::get_subscriber(
        env!("CARGO_PKG_NAME").into(),
        &config.level,
        std::io::stdout,
    );

    log::init_subscriber(subscriber);

    // Build the server
    let listener = TcpListener::bind(config.server_url()).context("Failed to bind to port")?;

    let cookie_key = Key::from(config.cookie_key.as_bytes());

    let store = RedisSessionStore::new(config.redis_url).await?;

    let (tx, mut rx) = mpsc::channel::<Exchange>(128);

    spawn(async move {
        while let Some(action) = rx.recv().await {
            match action {
                Exchange::TwapOrder { action } => {
                    tracing::info!("Event: {:#?}", action);
                }
                _ => {
                    // Do something with the agent, info, and order
                }
            }
        }
    });

    // Global
    let chain = web::Data::new(Chain::Dev);
    let sender = web::Data::new(tx);

    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")
            // .allowed_origin("pnl.green")
            .allowed_methods(vec!["GET", "POST"])
            .allowed_headers(vec![header::AUTHORIZATION, header::ACCEPT])
            .allowed_header(header::CONTENT_TYPE)
            .supports_credentials()
            .max_age(3600);

        let sm = SessionMiddleware::builder(store.clone(), cookie_key.clone())
            .cookie_http_only(false)
            .cookie_same_site(SameSite::None)
            .build();

        App::new()
            .wrap(TracingLogger::default())
            .wrap(cors)
            .wrap(sm)
            .route("/hyperliquid", web::post().to(api::hyperliquid))
            .route("/status", web::get().to(api::status))
            .default_service(web::to(api::not_found))
            .app_data(chain.clone())
            .app_data(sender.clone())
    })
    .listen(listener)?
    .run()
    .await?;

    Ok(())
}
