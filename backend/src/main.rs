use std::{env, net::TcpListener, time::Duration};

use actix::spawn;
use actix_cors::Cors;
use actix_session::{storage::RedisSessionStore, SessionMiddleware};
use actix_web::{
    cookie::{Key, SameSite},
    http::header,
    web, App, HttpServer,
};
use anyhow::Context;
use backend::{
    api, log,
    model::hyperliquid::{InternalRequest, QueueElem},
    ws, Config,
};

use hyperliquid::{
    types::{
        exchange::{
            request::{Limit, OrderRequest, OrderType, Tif},
            response::Response,
        },
        info::response::AssetContext,
        Chain,
    },
    utils::{parse_price, parse_size},
    Exchange, Hyperliquid, Info,
};

use tokio::sync::{mpsc, RwLock};
use tracing_actix_web::TracingLogger;

const SLIPPAGE: f64 = 0.03;

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
    let ws_listener = tokio::net::TcpListener::bind(config.ws_url()).await?;

    let cookie_key = Key::from(config.cookie_key.as_bytes());

    let store = RedisSessionStore::new(config.redis_url).await?;

    let (tx, mut rx) = mpsc::channel::<InternalRequest>(128);

    let chain = Chain::Arbitrum;

    spawn(async move {
        while let Some(request) = rx.recv().await {
            match request {
                InternalRequest::TwapOrder {
                    request,
                    agent,
                    vault_address,
                } => {
                    tracing::info!("Received twap order request: {:#?}", request);

                    let info: Info = Hyperliquid::new(chain);
                    let exchange: Exchange = Hyperliquid::new(chain);

                    // auto calculate order count based on minutes
                    let order_count = request.runtime / 60 * 2 + 1;

                    let sz = request.sz / order_count as f64;

                    let interval = Duration::from_secs(request.frequency);

                    for i in 1..=order_count {
                        let (limit_px, sz_decimals) = {
                            let ctxs = match info.contexts().await {
                                Ok(ctxs) => ctxs,
                                Err(err) => {
                                    tracing::error!("{:#?}", err);
                                    return;
                                }
                            };

                            let asset_ctxs = match ctxs.get(1) {
                                Some(AssetContext::Ctx(ctxs)) => ctxs,
                                _ => {
                                    tracing::error!("Failed to get asset contexts");
                                    return;
                                }
                            };

                            let mark_px = match asset_ctxs.get(request.asset as usize) {
                                Some(ctx) => &ctx.mark_px,
                                _ => {
                                    tracing::error!("Failed to get mark price");
                                    return;
                                }
                            };

                            let mark_px: f64 = match mark_px.parse() {
                                Ok(px) => px,
                                Err(err) => {
                                    tracing::error!("{:#?}", err);
                                    return;
                                }
                            };

                            let limit_px =
                                mark_px * (1.0 + if request.is_buy { SLIPPAGE } else { -SLIPPAGE }); // 3% slippage

                            let universe = match ctxs.first() {
                                Some(AssetContext::Meta(meta)) => &meta.universe,
                                _ => {
                                    tracing::error!("Failed to get universe");
                                    return;
                                }
                            };

                            let sz_decimals = match universe.get(request.asset as usize) {
                                Some(asset) => asset.sz_decimals as u32,
                                _ => {
                                    tracing::error!("Failed to get sz_decimals");
                                    return;
                                }
                            };

                            (limit_px, sz_decimals)
                        };

                        let order = OrderRequest {
                            asset: request.asset,
                            is_buy: request.is_buy,
                            limit_px: parse_price(limit_px),
                            sz: parse_size(sz, sz_decimals),
                            reduce_only: request.reduce_only,
                            order_type: OrderType::Limit(Limit { tif: Tif::Ioc }),
                            cloid: None,
                        };

                        match exchange
                            .place_order(agent.clone(), vec![order], vault_address)
                            .await
                        {
                            Ok(order) => match order {
                                Response::Err(err) => {
                                    println!("{:#?}", err);
                                    return;
                                }
                                Response::Ok(order) => {
                                    println!("Order placed: {:#?}", order);
                                    println!(
                                        "{} order was successfully placed.\n",
                                        if request.is_buy { "Buy" } else { "Sell" }
                                    );
                                }
                            },
                            Err(err) => {
                                println!("{:#?}", err);
                                return;
                            }
                        }
                        if i != order_count {
                            println!("Waiting for {} minutes", interval.as_secs() / 60);
                            println!("{}", "-".repeat(5));
                            tokio::time::sleep(interval).await;
                        }
                    }
                }
            }
        }
    });
    // WS
    spawn(async move {
        while let Ok((stream, _addr)) = ws_listener.accept().await {
            spawn(ws::handler::handler(stream));
        }
    });

    let queue: RwLock<Vec<QueueElem>> = RwLock::new(vec![]);
    let queue = web::Data::new(queue);
    let queue_2 = queue.clone();

    tokio::spawn(async move {
        let exchange: Exchange = Hyperliquid::new(chain);

        loop {
            let queue_r = queue_2.read().await;

            let mut indices_to_remove = Vec::new();

            for (i, elem) in queue_r.iter().enumerate() {
                match elem.check().await {
                    Ok(true) => {
                        indices_to_remove.push(i);
                    }
                    Err(err) => {
                        //tracing::error!("{:?}", err);
                    }
                    _ => {}
                }
            }

            drop(queue_r);

            if !indices_to_remove.is_empty() {
                let mut queue_w = queue_2.write().await;

                for &i in indices_to_remove.iter().rev() {
                    let elem = queue_w.remove(i);
                    drop(queue_w);
                    elem.execute(&exchange).await;
                    queue_w = queue_2.write().await;
                }
            }
        }
    });

    // Global
    let chain = web::Data::new(chain);
    let sender = web::Data::new(tx);

    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")
            .allowed_origin("http://127.0.0.1:3000")
            .allowed_origin("https://trade.pnl.green")
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
            .app_data(queue.clone())
    })
    .listen(listener)?
    .run()
    .await?;

    Ok(())
}
