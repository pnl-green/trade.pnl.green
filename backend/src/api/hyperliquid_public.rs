use actix_web::{web, HttpResponse};
use hyperliquid::{
    types::info::response::{AssetContext, Ctx, Universe},
    Chain, Hyperliquid, Info,
};

use crate::{error::Error, prelude::Result};

fn coin_from_symbol(symbol: &str) -> String {
    let upper = symbol.to_ascii_uppercase();
    upper
        .split('-')
        .next()
        .unwrap_or(symbol)
        .to_string()
}

fn extract_asset_ctx<'a>(ctxs: &'a [AssetContext], coin: &str) -> Result<(&'a Ctx, &'a Universe)> {
    let contexts = ctxs
        .get(1)
        .ok_or_else(|| Error::BadRequestError("Missing asset contexts".into()))?;

    let meta = ctxs
        .first()
        .ok_or_else(|| Error::BadRequestError("Missing meta context".into()))?;

    let AssetContext::Meta(meta) = meta else {
        return Err(Error::BadRequestError("Unexpected meta shape".into()));
    };

    let AssetContext::Ctx(asset_ctxs) = contexts else {
        return Err(Error::BadRequestError("Unexpected ctx shape".into()));
    };

    let (index, universe) = meta
        .universe
        .iter()
        .enumerate()
        .find(|(_, item)| item.name.eq_ignore_ascii_case(coin))
        .ok_or_else(|| Error::BadRequestError("Unknown symbol".into()))?;

    let asset_ctx = asset_ctxs
        .get(index)
        .ok_or_else(|| Error::BadRequestError("Asset context missing".into()))?;

    Ok((asset_ctx, universe))
}

pub async fn asset_info(path: web::Path<String>) -> Result<HttpResponse> {
    let symbol = path.into_inner();
    let coin = coin_from_symbol(&symbol);

    let info: Info = Hyperliquid::new(Chain::Arbitrum);
    let ctxs = info.contexts().await?;
    let (asset_ctx, universe) = extract_asset_ctx(&ctxs, &coin)?;

    let mark_px: f64 = asset_ctx.mark_px.parse().unwrap_or_default();
    let oracle_px: f64 = asset_ctx.oracle_px.parse().unwrap_or_default();
    let prev_day_px: f64 = asset_ctx.prev_day_px.parse().unwrap_or_default();
    let volume: f64 = asset_ctx.day_ntl_vlm.parse().unwrap_or_default();
    let open_interest: f64 = asset_ctx.open_interest.parse().unwrap_or_default();
    let funding_rate: f64 = asset_ctx.funding.parse().unwrap_or_default();

    let change_usd = mark_px - prev_day_px;
    let change_pct = if prev_day_px.abs() > f64::EPSILON {
        (change_usd / prev_day_px) * 100.0
    } else {
        0.0
    };

    let countdown_secs = 0_i64;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "symbol": symbol,
        "coin": coin,
        "markPrice": mark_px,
        "oraclePrice": oracle_px,
        "change24hPct": change_pct,
        "change24hUsd": change_usd,
        "volume24h": volume,
        "openInterest": open_interest,
        "fundingRate": funding_rate,
        "fundingCountdown": countdown_secs,
        "meta": {
            "maxLeverage": universe.max_leverage,
            "tickSize": universe.tick_size,
            "pxDecimals": universe.px_decimals,
            "szDecimals": universe.sz_decimals,
        }
    })))
}

pub async fn orderbook(path: web::Path<String>) -> Result<HttpResponse> {
    let symbol = path.into_inner();
    let coin = coin_from_symbol(&symbol);

    let info: Info = Hyperliquid::new(Chain::Arbitrum);
    let book = info.l2_book(coin.clone()).await?;

    let bids = book
        .levels
        .get(1)
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .map(|level| serde_json::json!({
            "px": level.px.parse::<f64>().unwrap_or_default(),
            "sz": level.sz.parse::<f64>().unwrap_or_default(),
            "n": level.n.unwrap_or(0),
        }))
        .collect::<Vec<_>>();

    let asks = book
        .levels
        .first()
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .map(|level| serde_json::json!({
            "px": level.px.parse::<f64>().unwrap_or_default(),
            "sz": level.sz.parse::<f64>().unwrap_or_default(),
            "n": level.n.unwrap_or(0),
        }))
        .collect::<Vec<_>>();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "symbol": symbol,
        "coin": coin,
        "timestamp": book.time,
        "bids": bids,
        "asks": asks,
    })))
}

pub async fn trades(path: web::Path<String>) -> Result<HttpResponse> {
    let symbol = path.into_inner();
    let coin = coin_from_symbol(&symbol);

    let info: Info = Hyperliquid::new(Chain::Arbitrum);
    let trades = info.trades(coin.clone(), None).await?;

    let normalized = trades
        .into_iter()
        .map(|trade| serde_json::json!({
            "px": trade.px.parse::<f64>().unwrap_or_default(),
            "sz": trade.sz.parse::<f64>().unwrap_or_default(),
            "side": trade.side,
            "hash": trade.hash,
            "timestamp": trade.time,
        }))
        .collect::<Vec<_>>();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "symbol": symbol,
        "coin": coin,
        "trades": normalized,
    })))
}

pub async fn candles(symbol: web::Path<String>, query: web::Query<serde_json::Value>) -> Result<HttpResponse> {
    let logical_symbol = symbol.into_inner();
    let coin = coin_from_symbol(&logical_symbol);
    let tf = query
        .get("tf")
        .and_then(|v| v.as_str())
        .unwrap_or("1m")
        .to_string();
    let from = query
        .get("from")
        .and_then(|v| v.as_u64())
        .unwrap_or(0);
    let to = query.get("to").and_then(|v| v.as_u64()).unwrap_or_else(|| {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default();
        now.as_millis() as u64
    });

    let info: Info = Hyperliquid::new(Chain::Arbitrum);
    let data = info
        .candle_snapshot(coin.clone(), tf, from, to)
        .await?;

    let candles = data
        .into_iter()
        .map(|c| serde_json::json!({
            "time": c.t,
            "open": c.o.parse::<f64>().unwrap_or_default(),
            "high": c.h.parse::<f64>().unwrap_or_default(),
            "low": c.l.parse::<f64>().unwrap_or_default(),
            "close": c.c.parse::<f64>().unwrap_or_default(),
            "volume": c.v.parse::<f64>().unwrap_or_default(),
        }))
        .collect::<Vec<_>>();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "symbol": logical_symbol,
        "coin": coin,
        "candles": candles,
    })))
}

pub fn hl_scope() -> actix_web::Scope {
    web::scope("/hl")
        .route("/{symbol}/asset-info", web::get().to(asset_info))
        .route("/{symbol}/orderbook", web::get().to(orderbook))
        .route("/{symbol}/trades", web::get().to(trades))
        .route("/{symbol}/candles", web::get().to(candles))
}
