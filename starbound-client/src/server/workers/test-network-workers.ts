import { l } from "../utils";
import { coin } from "@cosmjs/stargate";
import { _mockUpdatePoolsAndUsers } from "../helpers/api-helpers";
import { getCwHelpers } from "../helpers/cw-helpers";
import { DENOMS } from "../helpers/interfaces";
import { getSgHelpers } from "../helpers/sg-helpers";
import {
  SwapStruct,
  DelegationStruct,
  ClientStruct,
  User,
  Asset,
  QueryPoolsAndUsersResponse,
  PoolExtracted,
  UserExtracted,
  TransferParams,
  IbcStruct,
} from "../helpers/interfaces";
import {
  CONTRACT_ADDRESS,
  PREFIX,
  RPC,
  SEED_ALICE,
  SEED_BOB,
  SEED_DAPP,
} from "../config/test-network-config.json";

const aliceClientStruct: ClientStruct = {
  prefix: PREFIX,
  RPC,
  seed: SEED_ALICE,
};
const bobClientStruct: ClientStruct = {
  prefix: PREFIX,
  RPC,
  seed: SEED_BOB,
};
const dappClientStruct: ClientStruct = { prefix: PREFIX, RPC, seed: SEED_DAPP };

async function init() {
  // dapp cosmwasm helpers
  const {
    owner: dappAddr,
    _cwSwap,
    _cwGetPools,
    _cwGetPrices,
    _cwQueryPoolsAndUsers,
    _cwDebugQueryPoolsAndUsers,
    _cwUpdatePoolsAndUsers,
    _cwQueryAssets,
    _cwDebugQueryBank,
    _cwTransfer,
    _cwMultiTransfer,
    _cwSgSend,
  } = await getCwHelpers(dappClientStruct, CONTRACT_ADDRESS);

  // dapp stargate helpers
  const {
    _sgDelegateFrom,
    _sgGetTokenBalances,
    _sgUpdatePoolList,
    _sgTransfer,
    _sgSend,
  } = await getSgHelpers(dappClientStruct);

  async function sgUpdatePoolList() {
    let pools = await _sgUpdatePoolList();
    l({ pools });
  }

  async function _queryBalance() {
    let balances = await _sgGetTokenBalances(CONTRACT_ADDRESS);
    l({ contract: balances });
  }

  const grantStakeStruct: DelegationStruct = {
    targetAddr: dappAddr,
    tokenAmount: 5_000,
    tokenDenom: DENOMS.OSMO,
    validatorAddr: "osmovaloper1c584m4lq25h83yp6ag8hh4htjr92d954kphp96",
  };

  async function sgDelegateFrom(stakeFromStruct: DelegationStruct) {
    try {
      const tx = await _sgDelegateFrom(stakeFromStruct);
      l(tx, "\n");
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwGetPools() {
    try {
      await _cwGetPools();
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwGetPrices() {
    try {
      await _cwGetPrices();
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwDebugQueryPoolsAndUsers() {
    try {
      await _cwDebugQueryPoolsAndUsers();
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwQueryPoolsAndUsers() {
    try {
      return await _cwQueryPoolsAndUsers();
    } catch (error) {
      l(error, "\n");
      let empty: QueryPoolsAndUsersResponse = { pools: [], users: [] };
      return empty;
    }
  }

  async function cwMockUpdatePoolsAndUsers(
    poolsAndUsers: QueryPoolsAndUsersResponse
  ) {
    l("cwMockUpdatePoolsAndUsers");

    let { pools, users } = poolsAndUsers;

    pools = pools.map((pool) => {
      return { ...pool, price: `${1.1 * +pool.price}` };
    });

    users = users.map((user) => {
      let asset_list = user.asset_list.map((asset) => {
        return { ...asset, wallet_balance: `${+asset.wallet_balance + 1}` };
      });

      return { ...user, asset_list };
    });

    try {
      await _cwUpdatePoolsAndUsers(pools, users);
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwQueryAssets() {
    let aliceAddr = "osmo1gjqnuhv52pd2a7ets2vhw9w9qa9knyhy7y9tgx";
    let bobAddr = "osmo1chgwz55h9kepjq0fkj5supl2ta3nwu63e3ds8x";
    let addresses = [aliceAddr, bobAddr];

    for (let addr of addresses) {
      try {
        await _cwQueryAssets(addr);
      } catch (error) {
        l(error, "\n");
      }
    }
  }

  async function cwSwap() {
    l("cwSwap");
    try {
      await _cwSwap();
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwDebugQueryBank() {
    try {
      await _cwDebugQueryBank();
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwTransfer() {
    l("cwTransfer");
    try {
      await _cwTransfer();
    } catch (error) {
      l(error, "\n");
    }
  }

  const junoChannel = "channel-1110";
  const junoAddr = "juno1xjeu7n97xs0pv7lxcedat00d6vgyr9m54vefn2";
  const junoRevision = "5";
  const junoHeight = "500000";
  let junoAmount = "1";

  let junoParams: TransferParams = {
    channel_id: junoChannel,
    to: junoAddr,
    amount: junoAmount,
    denom: DENOMS.JUNO,
    block_revision: junoRevision,
    block_height: junoHeight,
  };

  let params: TransferParams[] = [junoParams, 
//	junoParams
	];

  async function cwMultiTransfer() {
    l("cwMultiTransfer");
    try {
      await _cwMultiTransfer(params);
    } catch (error) {
      l(error, "\n");
    }
  }

  let ibcStruct: IbcStruct = {
    amount: 1,
    dstPrefix: "juno",
    sourceChannel: junoChannel,
    sourcePort: "transfer",
  };

  async function sgTransfer() {
    try {
      const tx = await _sgTransfer(ibcStruct);
      l(tx, "\n");
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwSgSend() {
    try {
      const tx = await _cwSgSend();
      l(tx, "\n");
    } catch (error) {
      l(error, "\n");
    }
  }

  async function sgSend() {
    try {
      const tx = await _sgSend(CONTRACT_ADDRESS, coin(500_000, "uosmo"));
      l(tx, "\n");
    } catch (error) {
      l(error, "\n");
    }
  }

  return {
    _queryBalance,
    cwSwap,
    sgDelegateFrom,
    sgUpdatePoolList,
    cwGetPools,
    cwGetPrices,
    cwDebugQueryPoolsAndUsers,
    cwQueryPoolsAndUsers,
    cwMockUpdatePoolsAndUsers,
    cwQueryAssets,
    cwDebugQueryBank,
    cwTransfer,
    cwMultiTransfer,
    sgTransfer,
    cwSgSend,
    sgSend,
  };
}

export { init };
