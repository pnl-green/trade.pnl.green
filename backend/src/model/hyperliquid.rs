use std::sync::Arc;

use ethers::{
    signers::LocalWallet,
    types::{Address, Signature},
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
    SpotMeta,
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
    #[serde(rename = "m", alias = "minutes")]
    pub minutes: u32,
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
pub struct ConnectAgent {
    pub connection_id: String,
    pub source: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Connect {
    pub agent: ConnectAgent,
    pub agent_address: Address,
    pub chain: String,
    #[serde(rename = "type")]
    pub type_: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectRequest {
    action: Connect,
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
    Connect(ConnectRequest),
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
