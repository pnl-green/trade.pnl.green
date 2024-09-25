use std::sync::Arc;

use ethers::{
    signers::LocalWallet,
    types::{Address, Signature, U256},
};
use hyperliquid::types::{
    exchange::request::{CancelRequest, OrderRequest},
    info::request::CandleSnapshotRequest,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Agent {
    pub public_key: Address,
    pub private_key: String,
    pub user: Address,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum Info {
    SubAccounts { user: Address },
    HistoricalOrders { user: Address },
    UserFees { user: Address },
    CandleSnapshot { req: CandleSnapshotRequest },
    PairCandleSnapshot { req: CandleSnapshotRequest, pair_coin: String },
    Depth { req: DepthCalculationRequest },
    Delta { req: DeltaCalculationRequest },
    SpotMeta,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeltaCalculationRequest {
    pub symbol: String,
    pub range: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeltaCalculationResponse {
    pub delta: f32,
    pub timestamp: u64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DepthCalculationRequest {
    pub symbol: String,
    pub percentage: f32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DepthCalculationResponse {
    pub total_size: f32,
    pub total_price: f32,
    pub timestamp: u64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Order {
    pub orders: Vec<OrderRequest>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSubAccount {
    pub name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubAccountModify {
    pub name: String,
    pub sub_account_user: Address,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubAccountTransfer {
    pub is_deposit: bool,
    pub sub_account_user: Address,
    pub usd: u64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateLeverage {
    pub asset: u32,
    pub is_cross: bool,
    pub leverage: u32,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateIsolatedMargin {
    pub asset: u32,
    pub is_buy: bool,
    pub ntli: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TwapOrderRequest {
    #[serde(rename = "a", alias = "asset")]
    pub asset: u32,
    #[serde(rename = "b", alias = "isBuy")]
    pub is_buy: bool,
    #[serde(rename = "m", alias = "runtime")]
    pub runtime: u64,
    #[serde(rename = "r", alias = "reduceOnly")]
    pub reduce_only: bool,
    #[serde(rename = "s", alias = "sz")]
    pub sz: f64,
    #[serde(rename = "t", alias = "randomize")]
    pub randomize: bool,
    #[serde(rename = "f", alias = "frequency")]
    pub frequency: u64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Twap {
    pub twap: TwapOrderRequest,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Cancel {
    pub cancels: Vec<CancelRequest>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AproveAgent {
    pub hyperliquid_chain: String,
    pub signature_chain_id: U256,
    pub agent_address: Address,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent_name: Option<String>,
    pub nonce: u64,
    #[serde(rename = "type")]
    pub type_: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AproveAgentRequest {
    action: AproveAgent,
    nonce: u64,
    signature: Signature,
    #[serde(skip_serializing_if = "Option::is_none")]
    vault_address: Option<Address>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum Exchange {
    #[serde(rename_all = "camelCase")]
    Order {
        action: Order,
        vault_address: Option<Address>,
    },
    CreateSubAccount {
        action: CreateSubAccount,
    },
    SubAccountModify {
        action: SubAccountModify,
    },
    SubAccountTransfer {
        action: SubAccountTransfer,
    },
    UpdateLeverage {
        action: UpdateLeverage,
    },
    UpdateIsolatedMargin {
        action: UpdateIsolatedMargin,
    },
    #[serde(rename_all = "camelCase")]
    NormalTpsl {
        action: Order,
        vault_address: Option<Address>,
    },
    #[serde(rename_all = "camelCase")]
    Cancel {
        action: Cancel,
        vault_address: Option<Address>,
    },
    ApproveAgent(AproveAgentRequest),

    #[serde(rename_all = "camelCase")]
    TwapOrder {
        action: Twap,
        vault_address: Option<Address>,
    },
}

#[derive(Debug)]
pub enum InternalRequest {
    TwapOrder {
        request: TwapOrderRequest,
        agent: Arc<LocalWallet>,
        vault_address: Option<Address>,
    },
}
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", tag = "endpoint")]
pub enum Request {
    Info(Info),
    Exchange(Exchange),
    Connect { user: Address },
}

#[derive(Debug, Serialize)]
#[serde(tag = "method", rename_all = "camelCase")]
pub enum WSMethod {
    Ping,
    Subscribe(Subscription),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Subscription {
    pub subscription: Subscribe,
}

impl Subscription {
    pub fn new(subscription: Subscribe) -> Self {
        Self { subscription }
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum Subscribe {
    Candle { coin: String, interval: String },
}

#[derive(Debug, Deserialize)]
#[serde(tag = "channel", content = "data", rename_all = "camelCase")]
pub enum WSResponse {
    SubscriptionResponse(Subscription),
    Candle(Candle),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Candle {
    #[serde(rename = "t")]
    pub open_time: i64,
    #[serde(rename = "T")]
    pub close_time: i64,
    #[serde(rename = "s")]
    pub symbol: String,
    #[serde(rename = "i")]
    pub interval: String,
    #[serde(rename = "o", deserialize_with = "parse")]
    pub open_price: f64,
    #[serde(rename = "c", deserialize_with = "parse")]
    pub close_price: f64,
    #[serde(rename = "h", deserialize_with = "parse")]
    pub high_price: f64,
    #[serde(rename = "l", deserialize_with = "parse")]
    pub low_price: f64,
    #[serde(rename = "v", deserialize_with = "parse")]
    pub volume: f64,
    #[serde(rename = "n")]
    pub num_trade: i64,
}

impl Candle {
    pub fn pair(&self, right: &Self) -> Self {
        Self {
            open_time: self.open_time,
            close_time: self.close_time,
            symbol: format!("{}{}", self.symbol, right.symbol),
            interval: self.interval.clone(),
            open_price: self.open_price / right.open_price,
            close_price: self.close_price / right.close_price,
            high_price: self.high_price / right.high_price,
            low_price: self.low_price / right.low_price,
            volume: 0., // self.volume + right.volume, // TODO: how do we handle volume in pairs?
            num_trade: self.num_trade + right.num_trade,
        }
    }
}

fn parse<'de, T, D>(de: D) -> Result<T, D::Error>
where
    D: serde::Deserializer<'de>,
    T: std::str::FromStr,
    <T as std::str::FromStr>::Err: std::fmt::Display,
{
    String::deserialize(de)?
        .parse()
        .map_err(serde::de::Error::custom)
}
