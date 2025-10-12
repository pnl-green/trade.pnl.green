//! Hyperliquid-facing data contracts shared between HTTP handlers, websocket
//! streams, and background workers.
//!
//! These types wrap SDK requests with serde attributes so frontend payloads can
//! use camelCase keys and tag-based enums. They also introduce helper structs
//! that model internal TWAP queues and conditional order execution.

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
    /// Shared cache of live websocket subscriptions keyed by symbol.
    pub static ref CONNECTIONS: Arc<Mutex<HashMap<String, ChannelConnection>>> =
        Arc::new(Mutex::new(HashMap::new()));
}

/// Signing credentials used when executing Hyperliquid orders.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Agent {
    /// Public key identifying the broker account on Hyperliquid.
    pub public_key: Address,
    /// Hex-encoded signer private key stored in the agent vault.
    pub private_key: String,
    /// Hyperliquid user address the agent operates on behalf of.
    pub user: Address,
}

/// Request payloads supported by the Hyperliquid info endpoint.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum Info {
    /// Fetch sub-account metadata for a Hyperliquid user.
    SubAccounts {
        /// User address to query.
        user: Address,
    },
    /// Retrieve the historical orders list for a user.
    HistoricalOrders {
        /// User address to query.
        user: Address,
    },
    /// Retrieve fee information for a specific user.
    UserFees {
        /// User address to query.
        user: Address,
    },
    /// Request a candle snapshot for a given asset and interval.
    CandleSnapshot {
        /// Candle request parameters passed to the SDK.
        req: CandleSnapshotRequest,
    },
    /// Request a synthetic pair candle snapshot.
    PairCandleSnapshot {
        /// Base candle request describing the two symbols.
        req: CandleSnapshotRequest,
        /// Quote asset paired with the candle snapshot.
        pair_coin: String,
    },
    /// Calculate book depth statistics for a symbol.
    Depth {
        /// Depth calculation parameters.
        req: DepthCalculationRequest,
    },
    /// Calculate delta exposure metrics for a symbol.
    Delta {
        /// Delta calculation parameters.
        req: DeltaCalculationRequest,
    },
    /// Query Hyperliquid spot metadata from the info endpoint.
    SpotMeta,
}

/// Parameters required to compute user delta exposure.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeltaCalculationRequest {
    /// Symbol to evaluate delta exposure for.
    pub symbol: String,
    /// Human-readable time range (e.g. `1h`) determining how far back to look.
    pub range: String,
}

/// Result payload returned to the frontend after a delta calculation.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeltaCalculationResponse {
    /// Calculated delta for the requested period.
    pub delta: f32,
    /// Millisecond timestamp of the calculation.
    pub timestamp: u64,
}

/// Input describing how to aggregate depth across the order book.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DepthCalculationRequest {
    /// Symbol whose book depth is requested.
    pub symbol: String,
    /// Percentage band over which to aggregate depth.
    pub percentage: f32,
}

/// Output returned after aggregating depth across the requested band.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DepthCalculationResponse {
    /// Aggregate size of orders within the requested band.
    pub total_size: f32,
    /// VWAP-style aggregate price within the band.
    pub total_price: f32,
    /// Millisecond timestamp of the calculation snapshot.
    pub timestamp: u64,
}

/// Wrapper around one or more Hyperliquid order submissions.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Order {
    /// Batch of limit/market orders to place via the exchange endpoint.
    pub orders: Vec<OrderRequest>,
}

/// Payload for creating a new sub-account.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSubAccount {
    /// Human-readable label for the new sub-account.
    pub name: String,
}

/// Parameters used to rename an existing sub-account.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubAccountModify {
    /// New display name for the sub-account.
    pub name: String,
    /// Address of the sub-account to mutate.
    pub sub_account_user: Address,
}

/// Request payload for transferring funds to or from a sub-account.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubAccountTransfer {
    /// Direction flag: `true` when depositing into the sub-account.
    pub is_deposit: bool,
    /// Address of the sub-account to move funds to/from.
    pub sub_account_user: Address,
    /// USD amount to transfer.
    pub usd: u64,
}

/// Parameters for updating account-wide leverage settings.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateLeverage {
    /// Asset identifier to apply leverage to.
    pub asset: u32,
    /// Whether leverage should be cross or isolated.
    pub is_cross: bool,
    /// Desired leverage multiplier.
    pub leverage: u32,
}

/// Payload for adjusting isolated margin on a particular asset.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateIsolatedMargin {
    /// Asset identifier to adjust.
    pub asset: u32,
    /// Direction flag for the margin update.
    pub is_buy: bool,
    /// Net total leverage impact requested.
    pub ntli: i64,
}

/// TWAP execution configuration submitted by the frontend.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TwapOrderRequest {
    /// Asset identifier to trade.
    #[serde(rename = "a", alias = "asset")]
    pub asset: u32,
    /// Direction of the TWAP execution.
    #[serde(rename = "b", alias = "isBuy")]
    pub is_buy: bool,
    /// Total runtime (in seconds) to spread the execution over.
    #[serde(rename = "m", alias = "runtime")]
    pub runtime: u64,
    /// Whether to submit orders with reduce-only semantics.
    #[serde(rename = "r", alias = "reduceOnly")]
    pub reduce_only: bool,
    /// Target size per execution slice.
    #[serde(rename = "s", alias = "sz")]
    pub sz: f64,
    /// Whether to randomize order submission intervals.
    #[serde(rename = "t", alias = "randomize")]
    pub randomize: bool,
    /// Frequency (in seconds) between slices.
    #[serde(rename = "f", alias = "frequency")]
    pub frequency: u64,
}

/// Envelope carrying the TWAP order request.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Twap {
    /// Nested TWAP order configuration.
    pub twap: TwapOrderRequest,
}

/// Batch cancellation payload forwarded to Hyperliquid.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Cancel {
    /// Batch of cancel requests to forward to Hyperliquid.
    pub cancels: Vec<CancelRequest>,
}

/// Details required to approve an agent for delegated trading.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AproveAgent {
    /// Chain identifier used when authorising the agent.
    pub hyperliquid_chain: String,
    /// Signature domain chain id expected by the verifier.
    pub signature_chain_id: U256,
    /// Address of the agent being approved.
    pub agent_address: Address,
    /// Optional friendly name displayed for the agent.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent_name: Option<String>,
    /// Nonce associated with the approval message.
    pub nonce: u64,
    /// Type discriminator used by Hyperliquid for approval actions.
    #[serde(rename = "type")]
    pub type_: String,
}

/// Signed approval payload sent to Hyperliquid.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AproveAgentRequest {
    /// Approval payload describing the agent and chain context.
    action: AproveAgent,
    /// Request nonce echoed in the signing flow.
    nonce: u64,
    /// Signature authorising the approval.
    signature: Signature,
    /// Optional vault that should receive the approval.
    #[serde(skip_serializing_if = "Option::is_none")]
    vault_address: Option<Address>,
}

/// Payloads that reach the Hyperliquid exchange endpoint.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum Exchange {
    /// Place a spot or perp order on Hyperliquid.
    #[serde(rename_all = "camelCase")]
    Order {
        /// Optional risk metric returned from the frontend pre-check.
        risk: Option<f32>,
        /// Order payload to submit.
        action: Order,
        /// Optional vault to debit when placing the order.
        vault_address: Option<Address>,
    },
    /// Create a new Hyperliquid sub-account.
    CreateSubAccount {
        /// Parameters describing the sub-account creation.
        action: CreateSubAccount,
    },
    /// Rename an existing sub-account.
    SubAccountModify {
        /// Mutation payload.
        action: SubAccountModify,
    },
    /// Move funds between parent and sub-accounts.
    SubAccountTransfer {
        /// Transfer request parameters.
        action: SubAccountTransfer,
    },
    /// Update account leverage configuration.
    UpdateLeverage {
        /// Leverage adjustment details.
        action: UpdateLeverage,
    },
    /// Adjust isolated margin for a position.
    UpdateIsolatedMargin {
        /// Margin change request.
        action: UpdateIsolatedMargin,
    },
    /// Create or update take-profit/stop-loss orders.
    #[serde(rename_all = "camelCase")]
    NormalTpsl {
        /// Orders representing TP/SL legs.
        action: Order,
        /// Vault executing the order, if any.
        vault_address: Option<Address>,
    },
    /// Cancel existing orders by id.
    #[serde(rename_all = "camelCase")]
    Cancel {
        /// Cancellation payload.
        action: Cancel,
        /// Optional vault for permission checks.
        vault_address: Option<Address>,
    },
    /// Approve an agent to trade on the user's behalf.
    ApproveAgent(AproveAgentRequest),

    /// Submit a time-weighted average price (TWAP) execution.
    #[serde(rename_all = "camelCase")]
    TwapOrder {
        /// TWAP configuration payload.
        action: Twap,
        /// Vault executing the TWAP orders.
        vault_address: Option<Address>,
    },

    /// Conditional order executed when a supplied `Condition` evaluates true.
    #[serde(rename_all = "camelCase")]
    CondOrder {
        /// Action to run once the condition is met.
        action: CondAction,
        /// Trigger predicate evaluated against market data.
        condition: Condition,
        /// Source of the market data backing the condition.
        source: Source,
        /// Vault executing the resulting action.
        vault_address: Option<Address>,
    },
}

/// Actions executed when a [`Condition`] evaluates to `true`.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum CondAction {
    /// Submit a Hyperliquid order when the condition triggers.
    HLOrder(Order),
}

/// Queued conditional order awaiting execution by the background worker.
pub struct QueueElem {
    /// Origin of the condition data (currently only Hyperliquid).
    pub source: Source,
    /// Wallet authorised to execute the resulting action.
    pub agent: Arc<LocalWallet>,
    /// Action to perform once `condition` evaluates to true.
    pub action: CondAction,
    /// Condition tracked by the background worker.
    pub condition: Condition,
    /// Vault routing for the executed order, if set.
    pub vault_address: Option<Address>,
}

/// Trait implemented by condition types to determine whether they have been
/// satisfied.
#[async_trait]
pub trait Check {
    /// Evaluate the condition, returning `true` when it has been satisfied.
    async fn check(&self) -> anyhow::Result<bool>;
}

impl PairPrice {
    /// Retrieve the price from the cached websocket book for a symbol and
    /// level index.
    async fn get_price_from_book(
        &self,
        symbol: &str,
        level_index: usize,
    ) -> anyhow::Result<Option<f32>> {
        let connection = CONNECTIONS.lock().await;
        let receiver = connection
            .get(symbol)
            .ok_or_else(|| anyhow!("There are no connections for symbol {}", symbol))?;

        let ref_book = receiver.receiver.borrow();
        let ws_response = match ref_book.as_ref() {
            Some(response) => response,
            None => return Ok(None),
        };

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

            Ok(Some(price))
        } else {
            Err(anyhow!("Book is not L2Book"))
        }
    }
}

#[async_trait]
impl Check for PairPrice {
    /// Compare the cached book prices for both legs to determine whether the
    /// configured ratio threshold has been met.
    async fn check(&self) -> anyhow::Result<bool> {
        let left_price = self.get_price_from_book(&self.left_symbol, 0).await?;
        let right_price = self.get_price_from_book(&self.right_symbol, 1).await?;
        if left_price.is_none() || right_price.is_none() {
            return Ok(false);
        }
        let left_price = left_price.unwrap();
        let right_price = right_price.unwrap();

        let comparison_result = if self.is_less {
            left_price / right_price < self.price
        } else {
            left_price / right_price > self.price
        };

        Ok(comparison_result)
    }
}

impl QueueElem {
    /// Evaluate the stored condition against the latest websocket data.
    pub async fn check(&self) -> anyhow::Result<bool> {
        match &self.condition {
            Condition::PairPrice(pair_price) => pair_price.check().await,
            _ => Err(anyhow!("There is no such Condition")),
        }
    }

    /// Execute the queued action if the condition is satisfied, cleaning up
    /// websocket subscriptions when no longer needed.
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

/// Sources that can power a conditional order.
#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub enum Source {
    #[default]
    /// Hyperliquid websocket feeds maintained by the backend.
    Hyperliquid,
}

/// Available trigger predicates for conditional orders.
#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub enum Condition {
    /// Trigger based on the price ratio of two symbols.
    PairPrice(PairPrice),
}

/// Ratio-based condition comparing two book prices.
#[derive(Debug, Deserialize, Clone)]
pub struct PairPrice {
    /// Whether the trigger compares `left/right` with `< price` or `> price`.
    pub is_less: bool,
    /// Ratio threshold to compare against.
    pub price: f32,
    /// Symbol providing the numerator side of the comparison.
    pub left_symbol: String,
    /// Symbol providing the denominator side of the comparison.
    pub right_symbol: String,
}

/// Live websocket connection metadata stored in [`CONNECTIONS`].
pub struct ChannelConnection {
    /// Broadcast channel that delivers the latest websocket payload.
    pub receiver: watch::Receiver<Option<WSResponse>>,
    /// Signal used to request a graceful shutdown of the background task.
    pub stop_sender: oneshot::Sender<()>,
    /// Number of consumers currently relying on this connection.
    pub count: usize,
}

/// Internal requests handled by the websocket/worker infrastructure.
#[derive(Debug)]
pub enum InternalRequest {
    /// Queue entry representing a TWAP action to execute on the background
    /// worker.
    TwapOrder {
        /// TWAP configuration forwarded to the worker.
        request: TwapOrderRequest,
        /// Wallet executing the TWAP leg.
        agent: Arc<LocalWallet>,
        /// Optional vault routing for fills.
        vault_address: Option<Address>,
    },
}
/// Envelope for REST and websocket requests coming from the frontend.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", tag = "endpoint")]
pub enum Request {
    /// Hyperliquid info endpoint request.
    Info(Info),
    /// Hyperliquid exchange endpoint request.
    Exchange(Exchange),
    /// Initiate a websocket connection for a specific user.
    Connect { user: Address },
}

/// Methods supported by the Hyperliquid websocket API.
#[derive(Debug, Serialize)]
#[serde(tag = "method", rename_all = "camelCase")]
pub enum WSMethod {
    /// Keep-alive ping sent from client to server.
    Ping,
    /// Subscribe to a websocket stream.
    Subscribe(Subscription),
    /// Unsubscribe from a websocket stream.
    Unsubscribe(Subscription),
}

/// Wrapper around websocket subscription requests.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Subscription {
    /// Underlying subscription descriptor forwarded to Hyperliquid.
    pub subscription: Subscribe,
}

impl Subscription {
    /// Convenience constructor used by websocket handlers.
    pub fn new(subscription: Subscribe) -> Self {
        Self { subscription }
    }
}

/// Individual stream subscriptions understood by Hyperliquid.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum Subscribe {
    /// Stream candle updates for a given coin/interval.
    Candle { coin: String, interval: String },
    /// Stream level-2 book updates for a coin.
    L2Book { coin: String },
}

/// Payloads emitted by Hyperliquid websocket streams.
#[derive(Debug, Deserialize)]
#[serde(tag = "channel", content = "data", rename_all = "camelCase")]
pub enum WSResponse {
    /// Confirmation payload acknowledging a subscription change.
    SubscriptionResponse(Subscription),
    /// Candle update delivered by Hyperliquid.
    Candle(Candle),
    /// Level-2 order book snapshot/update.
    L2Book(L2Book),
}

/// Individual book levels returned by Hyperliquid.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Level {
    /// Price of the book level, encoded as a string by Hyperliquid.
    pub px: String,
    /// Size resting at the level.
    pub sz: String,
    /// Number of individual orders aggregated into the level.
    pub n: u64,
}

/// Order book snapshot used by the frontend depth views.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct L2Book {
    /// Symbol identifier for the book update.
    pub coin: String,
    /// Two-dimensional array of book levels split by side.
    pub levels: Vec<Vec<Level>>,
    /// Server timestamp of the book snapshot.
    pub time: u64,
}

/// Candle update emitted by Hyperliquid streams.
#[derive(Debug, Serialize, Deserialize)]
pub struct Candle {
    #[serde(rename = "t")]
    /// Opening timestamp for the interval.
    pub open_time: i64,
    #[serde(rename = "T")]
    /// Closing timestamp for the interval.
    pub close_time: i64,
    #[serde(rename = "s")]
    /// Symbol identifier returned by Hyperliquid.
    pub symbol: String,
    #[serde(rename = "i")]
    /// Interval label (e.g. `1m`).
    pub interval: String,
    #[serde(rename = "o", deserialize_with = "parse")]
    /// Opening price, parsed from the API's string encoding.
    pub open_price: f64,
    #[serde(rename = "c", deserialize_with = "parse")]
    /// Closing price for the interval.
    pub close_price: f64,
    #[serde(rename = "h", deserialize_with = "parse")]
    /// High price reached during the interval.
    pub high_price: f64,
    #[serde(rename = "l", deserialize_with = "parse")]
    /// Low price reached during the interval.
    pub low_price: f64,
    #[serde(rename = "v", deserialize_with = "parse")]
    /// Total traded volume.
    pub volume: f64,
    #[serde(rename = "n")]
    /// Number of trades observed.
    pub num_trade: i64,
}

impl Candle {
    /// Combine two candle streams into a synthetic pair candle, dividing price
    /// fields and aggregating metadata where appropriate.
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

/// Parse helper used by serde to convert Hyperliquid's string-encoded numeric
/// fields into the requested type.
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
