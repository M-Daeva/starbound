use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    Deposit {
        is_controlled_rebalancing: bool,
        is_current_period: bool,
    },
    Withdraw {
        amount: u128,
    },
    UpdateUserSettings {
        is_controlled_rebalancing: bool,
    },
    SwapTokens {
        from: String,
        to: String,
        amount: u128,
    },
    Transfer {
        receiver_addr: String,
        channel_id: String,
        token_amount: u128,
        token_symbol: String,
    },
    UpdatePoolList {},
    UpdateAssetList {},
    UpdateScheduler {
        address: String,
    },
    Process {},
}
