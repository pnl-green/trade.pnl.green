//! Helpers that wrap the Hyperliquid SDK for use by the API and websocket
//! layers.

pub mod info {
    use ethers::types::Address;
    use hyperliquid::{
        types::info::response::{CandleSnapshot, SubAccount},
        Info, Result,
    };

    /// Fetch the list of sub-accounts belonging to the provided user address.
    #[tracing::instrument(name = "Fetching sub accounts", skip(info))]
    pub async fn sub_accounts(info: &Info, user: Address) -> Result<Option<Vec<SubAccount>>> {
        info.sub_accounts(user).await
    }

    /// Retrieve a historical order list for the given user (currently routed to
    /// the sub-account endpoint until the SDK exposes the dedicated call).
    #[tracing::instrument(name = "Fetching historical orders", skip(info))]
    pub async fn historical_orders(info: &Info, user: Address) -> Result<Option<Vec<SubAccount>>> {
        // info.historical_orders(user).await
        info.sub_accounts(user).await
    }

    /// Fetch accumulated fee data for the provided user (placeholder for future
    /// dedicated SDK support).
    #[tracing::instrument(name = "Fetching user fees", skip(info))]
    pub async fn user_fees(info: &Info, user: Address) -> Result<Option<Vec<SubAccount>>> {
        // info.user_fees(user).await
        info.sub_accounts(user).await
    }

    /// Query a candlestick snapshot for a specific coin/interval range.
    #[tracing::instrument(name = "Fetching candle snapshot", skip(info))]
    pub async fn candle_snapshot(
        info: &Info,
        coin: String,
        interval: String,
        start_time: u64,
        end_time: u64,
    ) -> Result<Vec<CandleSnapshot>> {
        info.candle_snapshot(coin, interval, start_time, end_time)
            .await
    }
}

/// Utilities for composing higher-level synthetic data from Hyperliquid
/// responses.
pub mod pair {
    use crate::prelude::Result;
    use hyperliquid::types::info::response::CandleSnapshot;

    /// Derive a synthetic candle representing the ratio between two snapshots.
    pub fn pair_candle(
        left_candle: CandleSnapshot,
        right_candle: CandleSnapshot,
    ) -> Result<CandleSnapshot> {
        Ok(CandleSnapshot {
            t: left_candle.t,
            t_: left_candle.t_,
            i: left_candle.i,
            s: format!("{}-{}", left_candle.s, right_candle.s),
            c: (left_candle.c.parse::<f64>()? / right_candle.c.parse::<f64>()?).to_string(),
            h: (left_candle.h.parse::<f64>()? / right_candle.h.parse::<f64>()?).to_string(),
            l: (left_candle.l.parse::<f64>()? / right_candle.l.parse::<f64>()?).to_string(),
            o: (left_candle.o.parse::<f64>()? / right_candle.o.parse::<f64>()?).to_string(),
            v: 0.to_string(),
            n: left_candle.n + right_candle.n,
        })
    }
}
