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
        hyperliquid::{Agent, DepthCalculationResponse, Exchange, Info, InternalRequest, Request},
        Response,
    },
    prelude::Result,
    service::hyperliquid::info,
};

pub async fn hyperliquid(
    chain: web::Data<Chain>,
    req: web::Json<Request>,
    session: Session,
    sender: web::Data<Sender<InternalRequest>>,
) -> Result<impl Responder> {
    let req = req.into_inner();
    let chain = **chain;

    Ok(match req {
        Request::Info(req) => {
            let info = Hyperliquid::new(chain);

            match req {
                Info::SubAccounts { user } => {
                    tracing::info!("User: {:#?}", user);
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
                Info::Depth { req } => {
                    let book = info
                        .l2_book(req.symbol)
                        .await
                        .map_err(|msg| BadRequestError(msg.to_string()))?;

                    let percentage = req.percentage / 100.;
                    let is_ask = req.percentage < 0.;

                    let levels = if is_ask {
                        // ask
                        book.levels.first()
                    } else {
                        // bid
                        book.levels.get(1)
                    }
                    .ok_or(BadRequestError("Book doesn't contain ask/bid level".into()))?
                    .iter()
                    .filter_map(|l| Some((l.px.parse::<f32>().ok()?, l.sz.parse::<f32>().ok()?)))
                    .collect::<Vec<_>>();

                    let best = if is_ask {
                        levels.iter().max_by(|l1, l2| l1.0.total_cmp(&l2.0))
                    } else {
                        levels.iter().min_by(|l1, l2| l1.0.total_cmp(&l2.0))
                    }
                    .ok_or(BadRequestError(
                        "Ask/bid level doesn't have any items in it".into(),
                    ))?;
                    let mut total = DepthCalculationResponse {
                        total_price: 0.,
                        total_size: 0.,
                        timestamp: book.time,
                    };
                    let best_price = best.0;
                    for (px, sz) in levels {
                        if (is_ask && best_price * (1. + percentage) > px)
                            || (!is_ask && best_price * (1. + percentage) < px)
                        {
                            continue;
                        }
                        total.total_size += sz;
                        total.total_price += px;
                    }

                    HttpResponse::Ok().json(Response {
                        success: true,
                        data: Some(total),
                        msg: None,
                    })
                }
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

            match req {
                Exchange::Order {
                    action,
                    vault_address,
                } => {
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
                Exchange::NormalTpsl {
                    action,
                    vault_address,
                } => {
                    let data = exchange
                        .normal_tpsl(agent, action.orders, vault_address)
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
                Exchange::Cancel {
                    action,
                    vault_address,
                } => {
                    let data = exchange
                        .cancel_order(agent, action.cancels, vault_address)
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
                Exchange::ApproveAgent(req) => {
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
                Exchange::TwapOrder {
                    action,
                    vault_address,
                } => {
                    let request = action.twap;

                    // ----------------------------------------------------------------
                    // ensure that the frequency is between 1 and 3600 seconds; 1s to 1hr
                    if request.frequency < 1 || request.frequency > 3600 {
                        return Ok(HttpResponse::BadRequest().json(Response {
                            success: false,
                            data: None::<String>,
                            msg: Some("Frequency must be between 1 and 3600 seconds".into()),
                        }));
                    }

                    // ensure runtime is between 2 and 86400s; 2s to 24hrs
                    if request.runtime < 2 || request.runtime > 86400 {
                        return Ok(HttpResponse::BadRequest().json(Response {
                            success: false,
                            data: None::<String>,
                            msg: Some("Running time must be between 2 and 86400 seconds".into()),
                        }));
                    }

                    // ----------------------------------------------------------------

                    match sender
                        .send(InternalRequest::TwapOrder {
                            request,
                            agent,
                            vault_address,
                        })
                        .await
                    {
                        Ok(_) => HttpResponse::Created().json(Response {
                            success: true,
                            data: "Created".into(),
                            msg: None,
                        }),
                        Err(e) => {
                            tracing::error!("Failed to send twap order: {:#?}", e);

                            HttpResponse::InternalServerError().json(Response {
                                success: false,
                                data: None::<String>,
                                msg: Some("Failed to send twap order".into()),
                            })
                        }
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
