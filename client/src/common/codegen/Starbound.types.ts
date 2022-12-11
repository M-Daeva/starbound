/**
* This file was automatically generated by @cosmwasm/ts-codegen@0.24.0.
* DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
* and run the @cosmwasm/ts-codegen generate command to regenerate this file.
*/

export interface InstantiateMsg {}
export type ExecuteMsg = {
  deposit: {
    user: User;
  };
} | {
  withdraw: {
    amount: Uint128;
  };
} | {
  update_scheduler: {
    address: string;
  };
} | {
  update_pools_and_users: {
    pools: PoolExtracted[];
    users: UserExtracted[];
  };
} | {
  swap: {};
} | {
  transfer: {};
} | {
  multi_transfer: {
    params: TransferParams[];
  };
};
export type Uint128 = string;
export type Addr = string;
export type Decimal = string;
export interface User {
  asset_list: Asset[];
  day_counter: Uint128;
  deposited: Uint128;
  is_controlled_rebalancing: boolean;
}
export interface Asset {
  amount_to_send_until_next_epoch: Uint128;
  asset_denom: string;
  wallet_address: Addr;
  wallet_balance: Uint128;
  weight: Decimal;
}
export interface PoolExtracted {
  channel_id: string;
  denom: string;
  id: Uint128;
  port_id: string;
  price: Decimal;
  symbol: string;
}
export interface UserExtracted {
  asset_list: AssetExtracted[];
  osmo_address: string;
}
export interface AssetExtracted {
  asset_denom: string;
  wallet_address: string;
  wallet_balance: Uint128;
}
export interface TransferParams {
  amount: Uint128;
  block_height: Uint128;
  block_revision: Uint128;
  channel_id: string;
  denom: string;
  to: string;
}
export type QueryMsg = {
  query_user: {
    address: string;
  };
} | {
  query_pools_and_users: {};
};
export type MigrateMsg = string;
export interface QueryPoolsAndUsersResponse {
  pools: PoolExtracted[];
  users: UserExtracted[];
}
export interface QueryUserResponse {
  user: User;
}