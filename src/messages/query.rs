use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    QueryPoolsAndUsers {},
    DebugQueryPoolsAndUsers {},
    DebugQueryAssets { address: String },
    DebugQueryBank {},
}
