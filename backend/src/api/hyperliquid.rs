use std::sync::Arc;

use actix_session::Session;
use actix_web::{web, HttpResponse, Responder};
use anyhow::Context;
use ethers::{
    core::rand,
    signers::{LocalWallet, Signer},
    utils::hex::ToHex,
};
use hyperliquid::{
    types::{exchange::response, Chain, API},
    Hyperliquid,
};
use tokio::sync::mpsc::Sender;

use crate::{
    error::Error::BadRequestError,
    model::{
        hyperliquid::{Agent, Exchange, Info, Request},
        Response,
    },
    prelude::Result,
    service::hyperliquid::info,
};

pub async fn hyperliquid(
    chain: web::Data<Chain>,
    req: web::Json<Request>,
    session: Session,
    sender: web::Data<Sender<Exchange>>,
) -> Result<impl Responder> {
    let req = req.into_inner();
    let chain = **chain;

    Ok(match req {
        Request::Info(req) => {
            let info = Hyperliquid::new(chain);

            match req {
                Info::SubAccounts { user } => {
                    let data = info::sub_accounts(&info, user)
                        .await
                        .map_err(|msg| BadRequestError(msg.to_string()))?;

                    HttpResponse::Ok().json(Response {
                        success: true,
                        data,
                        msg: None,
                    })
                }

                Info::HistoricalOrders { user } => {
                    let data = info::historical_orders(&info, user)
                        .await
                        .map_err(|msg| BadRequestError(msg.to_string()))?;

                    HttpResponse::Ok().json(Response {
                        success: true,
                        data,
                        msg: None,
                    })
                }

                Info::UserFees { user } => {
                    let data = info::user_fees(&info, user)
                        .await
                        .map_err(|msg| BadRequestError(msg.to_string()))?;

                    HttpResponse::Ok().json(Response {
                        success: true,
                        data,
                        msg: None,
                    })
                }
                Info::CandleSnapshot { req } => {
                    let data = info::candle_snapshot(
                        &info,
                        req.coin,
                        req.interval,
                        req.start_time,
                        req.end_time,
                    )
                    .await
                    .map_err(|msg| BadRequestError(msg.to_string()))?;

                    HttpResponse::Ok().json(Response {
                        success: true,
                        data: Some(data),
                        msg: None,
                    })
                }
                Info::SpotMeta => match info.spot_meta().await {
                    Ok(data) => HttpResponse::Ok().json(Response {
                        success: true,
                        data: Some(data),
                        msg: None,
                    }),
                    Err(msg) => HttpResponse::Ok().json(Response {
                        success: false,
                        data: None::<String>,
                        msg: Some(msg.to_string()),
                    }),
                },
            }
        }
        Request::Exchange(req) => {
            let agent = session
                .get::<Agent>("agent")
                .context("Failed to get agent")?
                .ok_or_else(|| BadRequestError("Establish a connection first".to_string()))?;

            let agent: Arc<LocalWallet> = Arc::new(
                agent
                    .private_key
                    .parse()
                    .context("Failed to parse agent wallet")?,
            );

            let exchange: hyperliquid::Exchange = Hyperliquid::new(chain);

            let vault_address = None;

            match req {
                Exchange::Order { action } => {
                    let data = exchange
                        .place_order(agent, action.orders, vault_address)
                        .await
                        .map_err(|msg| BadRequestError(msg.to_string()))?;

                    match data {
                        response::Response::Ok(data) => HttpResponse::Ok().json(Response {
                            success: true,
                            data: Some(data),
                            msg: None,
                        }),
                        response::Response::Err(msg) => HttpResponse::Ok().json(Response {
                            success: false,
                            data: None::<String>,
                            msg: Some(msg),
                        }),
                    }
                }
                Exchange::CreateSubAccount { action } => {
                    let data = exchange
                        .create_sub_account(agent, action.name)
                        .await
                        .map_err(|msg| BadRequestError(msg.to_string()))?;

                    match data {
                        response::Response::Ok(data) => HttpResponse::Ok().json(Response {
                            success: true,
                            data: Some(data),
                            msg: None,
                        }),
                        response::Response::Err(msg) => HttpResponse::Ok().json(Response {
                            success: false,
                            data: None::<String>,
                            msg: Some(msg),
                        }),
                    }
                }
                Exchange::SubAccountModify { action } => {
                    let data = exchange
                        .sub_account_modify(agent, action.name, action.sub_account_user)
                        .await
                        .map_err(|msg| BadRequestError(msg.to_string()))?;

                    match data {
                        response::Response::Ok(data) => HttpResponse::Ok().json(Response {
                            success: true,
                            data: Some(data),
                            msg: None,
                        }),
                        response::Response::Err(msg) => HttpResponse::Ok().json(Response {
                            success: false,
                            data: None::<String>,
                            msg: Some(msg),
                        }),
                    }
                }
                Exchange::SubAccountTransfer { action } => {
                    let data = exchange
                        .sub_account_transfer(
                            agent,
                            action.is_deposit,
                            action.sub_account_user,
                            action.usd,
                        )
                        .await
                        .map_err(|msg| BadRequestError(msg.to_string()))?;

                    match data {
                        response::Response::Ok(data) => HttpResponse::Ok().json(Response {
                            success: true,
                            data: Some(data),
                            msg: None,
                        }),
                        response::Response::Err(msg) => HttpResponse::Ok().json(Response {
                            success: false,
                            data: None::<String>,
                            msg: Some(msg),
                        }),
                    }
                }
                Exchange::UpdateLeverage { action } => {
                    let data = exchange
                        .update_leverage(agent, action.leverage, action.asset, action.is_cross)
                        .await
                        .map_err(|msg| BadRequestError(msg.to_string()))?;

                    match data {
                        response::Response::Ok(data) => HttpResponse::Ok().json(Response {
                            success: true,
                            data: Some(data),
                            msg: None,
                        }),
                        response::Response::Err(msg) => HttpResponse::Ok().json(Response {
                            success: false,
                            data: None::<String>,
                            msg: Some(msg),
                        }),
                    }
                }
                Exchange::UpdateIsolatedMargin { action } => {
                    let data = exchange
                        .update_isolated_margin(agent, action.asset, action.is_buy, action.ntli)
                        .await
                        .map_err(|msg| BadRequestError(msg.to_string()))?;

                    match data {
                        response::Response::Ok(data) => HttpResponse::Ok().json(Response {
                            success: true,
                            data: Some(data),
                            msg: None,
                        }),
                        response::Response::Err(msg) => HttpResponse::Ok().json(Response {
                            success: false,
                            data: None::<String>,
                            msg: Some(msg),
                        }),
                    }
                }
                Exchange::TwapOrder { action } => {
                    match sender.send(Exchange::TwapOrder { action }).await {
                        Ok(_) => HttpResponse::Ok().json(Response {
                            success: true,
                            data: None::<String>,
                            msg: None,
                        }),
                        Err(_) => HttpResponse::Ok().json(Response {
                            success: false,
                            data: None::<String>,
                            msg: Some("Failed to send message".to_string()),
                        }),
                    }
                }
                Exchange::NormalTpsl { action } => todo!(),
                Exchange::Cancel { action } => todo!(),
                Exchange::Connect(req) => {
                    let data = exchange
                        .client
                        .post(&API::Exchange, &req)
                        .await
                        .map_err(|msg| BadRequestError(msg.to_string()))?;

                    match data {
                        response::Response::Ok(data) => HttpResponse::Ok().json(Response {
                            success: true,
                            data: Some(data),
                            msg: None,
                        }),
                        response::Response::Err(msg) => HttpResponse::Ok().json(Response {
                            success: false,
                            data: None::<String>,
                            msg: Some(msg),
                        }),
                    }
                }
            }
        }
        Request::Connect { user } => {
            // Generate an agent wallet
            let agent = LocalWallet::new(&mut rand::thread_rng());

            let public_key = agent.address();

            let private_key: String = agent.signer().to_bytes().encode_hex::<String>();

            let agent = Agent {
                public_key,
                private_key,
                user,
            };

            session
                .insert("agent", agent)
                .context("Failed to insert agent")?;

            HttpResponse::Ok().json(Response {
                success: true,
                data: Some(public_key),
                msg: None,
            })
        }
    })
}
