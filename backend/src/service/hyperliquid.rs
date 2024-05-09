pub mod info {
    use ethers::types::Address;
    use hyperliquid::{
        types::info::response::{CandleSnapshot, SubAccount},
        Info, Result,
    };

    #[tracing::instrument(name = "Fetching sub accounts", skip(info))]
    pub async fn sub_accounts(info: &Info, user: Address) -> Result<Option<Vec<SubAccount>>> {
        info.sub_accounts(user).await
    }

    #[tracing::instrument(name = "Fetching historical orders", skip(info))]
    pub async fn historical_orders(info: &Info, user: Address) -> Result<Option<Vec<SubAccount>>> {
        // info.historical_orders(user).await
        info.sub_accounts(user).await
    }

    #[tracing::instrument(name = "Fetching user fees", skip(info))]
    pub async fn user_fees(info: &Info, user: Address) -> Result<Option<Vec<SubAccount>>> {
        // info.user_fees(user).await
        info.sub_accounts(user).await
    }

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
