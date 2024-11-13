use ethers::{
    signers::LocalWallet,
    types::{Address, Signature, U256},
};
use std::{collections::HashMap, sync::Arc};
use tokio::sync::oneshot;
use tokio::sync::watch;

use anyhow::anyhow;
use async_trait::async_trait;
use hyperliquid::types::{
    exchange::request::{CancelRequest, OrderRequest},
    info::request::CandleSnapshotRequest,
};
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;
lazy_static! {
    pub static ref CONNECTIONS: Arc<Mutex<HashMap<String, ChannelConnection>>> =
        Arc::new(Mutex::new(HashMap::new()));
}

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
    SubAccounts {
        user: Address,
    },
    HistoricalOrders {
        user: Address,
    },
    UserFees {
        user: Address,
    },
    CandleSnapshot {
        req: CandleSnapshotRequest,
    },
    PairCandleSnapshot {
        req: CandleSnapshotRequest,
        pair_coin: String,
    },
    Depth {
        req: DepthCalculationRequest,
    },
    Delta {
        req: DeltaCalculationRequest,
    },
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

    #[serde(rename_all = "camelCase")]
    CondOrder {
        action: CondAction,
        condition: Condition,
        source: Source,
        vault_address: Option<Address>,
    },
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum CondAction {
    HLOrder(Order),
}

pub struct QueueElem {
    pub source: Source,
    pub agent: Arc<LocalWallet>,
    pub action: CondAction,
    pub condition: Condition,
    pub vault_address: Option<Address>,
}

#[async_trait]
pub trait Check {
    async fn check(&self) -> anyhow::Result<bool>;
}

impl PairPrice {
    async fn get_price_from_book(&self, symbol: &str, level_index: usize) -> anyhow::Result<f32> {
        let connection = CONNECTIONS.lock().await;
        let receiver = connection
            .get(symbol)
            .ok_or_else(|| anyhow!("There are no connections for symbol {}", symbol))?;

        let ref_book = receiver.receiver.borrow();
        let ws_response = ref_book
            .as_ref()
            .ok_or_else(|| anyhow!("Receiver doesn't contain WSResponse"))?;

        if let WSResponse::L2Book(book) = ws_response {
            let levels = book
                .levels
                .get(level_index)
                .ok_or_else(|| anyhow!("Book doesn't contain level {}", level_index))?
                .iter()
                .filter_map(|l| Some((l.px.parse::<f32>().ok()?, l.sz.parse::<f32>().ok()?)))
                .collect::<Vec<_>>();

            let price = if level_index == 0 {
                levels
                    .iter()
                    .max_by(|l1, l2| l1.0.total_cmp(&l2.0))
                    .ok_or_else(|| anyhow!("Level doesn't have any items"))?
                    .0
            } else {
                levels
                    .iter()
                    .min_by(|l1, l2| l1.0.total_cmp(&l2.0))
                    .ok_or_else(|| anyhow!("Level doesn't have any items"))?
                    .0
            };

            Ok(price)
        } else {
            Err(anyhow!("Book is not L2Book"))
        }
    }
}

#[async_trait]
impl Check for PairPrice {
    async fn check(&self) -> anyhow::Result<bool> {
        let left_price = self.get_price_from_book(&self.left_symbol, 0).await?;
        let right_price = self.get_price_from_book(&self.right_symbol, 1).await?;

        let comparison_result = if self.is_less {
            left_price / right_price < self.price
        } else {
            left_price / right_price > self.price
        };

        Ok(comparison_result)
    }
}

impl QueueElem {
    pub async fn check(&self) -> anyhow::Result<bool> {
        match &self.condition {
            Condition::PairPrice(pair_price) => pair_price.check().await,
            _ => Err(anyhow!("There is no such Condition")),
        }
    }

    pub async fn execute(self, exchange: &hyperliquid::Exchange) {
        match self.action {
            CondAction::HLOrder(order) => {
                let result = exchange
                    .place_order(self.agent.clone(), order.orders, self.vault_address)
                    .await;

                if let Err(err) = result {
                    tracing::error!("Failed to place order: {}", err);
                }

                match self.condition {
                    Condition::PairPrice(pair_price) => {
                        let mut connection = CONNECTIONS.lock().await;
                        let left_connection = connection.get_mut(&pair_price.left_symbol).unwrap();
                        left_connection.count -= 1;
                        if left_connection.count == 0 {
                            let con = connection.remove(&pair_price.left_symbol).unwrap();
                            con.stop_sender.send(());
                        }

                        let right_connection =
                            connection.get_mut(&pair_price.right_symbol).unwrap();
                        right_connection.count -= 1;
                        if right_connection.count == 0 {
                            let con = connection.remove(&pair_price.right_symbol).unwrap();
                            con.stop_sender.send(());
                        }
                    }
                }
            }
            _ => tracing::error!("There is no such action!"),
        }
    }
}

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub enum Source {
    #[default]
    Hyperliquid,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub enum Condition {
    PairPrice(PairPrice),
}

#[derive(Debug, Deserialize, Clone)]
pub struct PairPrice {
    pub is_less: bool,
    pub price: f32,
    pub left_symbol: String,
    pub right_symbol: String,
}

pub struct ChannelConnection {
    pub receiver: watch::Receiver<Option<WSResponse>>,
    pub stop_sender: oneshot::Sender<()>,
    pub count: usize,
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
    Unsubscribe(Subscription),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Subscription {
    pub subscription: Subscribe,
}

impl Subscription {
    pub fn new(subscription: Subscribe) -> Self {
        Self { subscription }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum Subscribe {
    Candle { coin: String, interval: String },
    L2Book { coin: String },
}

#[derive(Debug, Deserialize)]
#[serde(tag = "channel", content = "data", rename_all = "camelCase")]
pub enum WSResponse {
    SubscriptionResponse(Subscription),
    Candle(Candle),
    L2Book(L2Book),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Level {
    pub px: String,
    pub sz: String,
    pub n: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct L2Book {
    pub coin: String,
    pub levels: Vec<Vec<Level>>,
    pub time: u64,
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
            symbol: format!("{}/{}", self.symbol, right.symbol),
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
