pub mod info {
    use ethers::types::Address;
    use hyperliquid::{
        types::info::response::{CandleSnapshot, SubAccount},
        Info, Result,
    };

    pub async fn sub_accounts(info: &Info, user: Address) -> Result<Option<Vec<SubAccount>>> {
        info.sub_accounts(user).await
    }

    pub async fn historical_orders(info: &Info, user: Address) -> Result<Option<Vec<SubAccount>>> {
        // info.historical_orders(user).await
        info.sub_accounts(user).await
    }

    pub async fn user_fees(info: &Info, user: Address) -> Result<Option<Vec<SubAccount>>> {
        // info.user_fees(user).await
        info.sub_accounts(user).await
    }

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

    // pub async fn spot_meta(info: &Info) -> Result<()> {
    //     info.spot_meta().await
    // }
}
