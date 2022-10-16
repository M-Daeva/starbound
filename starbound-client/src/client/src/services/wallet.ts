import { createRequest, l } from "../utils";
import { DelegationStruct, User, Asset, DENOMS } from "../helpers/interfaces";
import { init } from "../workers/test-network-workers";

const req = createRequest({});

const grantStakeStruct: DelegationStruct = {
  targetAddr: "osmo18tnvnwkklyv4dyuj8x357n7vray4v4zupj6xjt",
  tokenAmount: 5_000,
  tokenDenom: DENOMS.OSMO,
  validatorAddr: "osmovaloper1c584m4lq25h83yp6ag8hh4htjr92d954kphp96",
};

let assetListAlice: Asset[] = [
  // ATOM
  {
    asset_denom: DENOMS.ATOM,
    wallet_address: "cosmos1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyklkm75",
    wallet_balance: "0",
    weight: "0.5",
    amount_to_send_until_next_epoch: "0",
  },
  // JUNO
  {
    asset_denom: DENOMS.JUNO,
    wallet_address: "juno1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyqd4qeg",
    wallet_balance: "0",
    weight: "0.5",
    amount_to_send_until_next_epoch: "0",
  },
];

let userAlice: User = {
  asset_list: assetListAlice,
  day_counter: "3",
  deposited_on_current_period: `${1_000_000}`,
  deposited_on_next_period: "0",
  is_controlled_rebalancing: false,
};

const deposit = async (user: User) => {
  const { cwDeposit, sgGrantStakeAuth, owner } = await init();
  const tx = await cwDeposit(user);
  // const tx2 = await sgGrantStakeAuth({
  //   validatorAddr: "junovaloper1w8cpaaljwrytquj86kvp9s72lvmddcc208ghun",
  //   targetAddr: "juno18tnvnwkklyv4dyuj8x357n7vray4v4zulm2dr9",
  //   tokenAmount: 1_000_000_000,
  //   tokenDenom: DENOMS.JUNO,
  // });
  return { tx, owner };
};

const withdraw = async (amount: number) => {
  const { cwWithdraw, owner } = await init();
  const tx = await cwWithdraw(amount);
  return { tx, owner };
};

const grantStakeAuth = async (grantStakeStruct: DelegationStruct) => {
  const { sgGrantStakeAuth, owner } = await init();
  const tx = await sgGrantStakeAuth(grantStakeStruct);
  return { tx, owner };
};

const debugQueryBank = async () => {
  const { cwDebugQueryBank, owner } = await init();
  const tx = await cwDebugQueryBank();
  return { tx, owner };
};

const queryPoolsAndUsers = async () => {
  const { cwQueryPoolsAndUsers, owner } = await init();
  const tx = await cwQueryPoolsAndUsers();
  return { tx, owner };
};

const debugQueryPoolsAndUsers = async () => {
  const { cwDebugQueryPoolsAndUsers, owner } = await init();
  const tx = await cwDebugQueryPoolsAndUsers();
  return { tx, owner };
};

const debugQueryAssets = async (address: string) => {
  const { cwDebugQueryAssets, owner } = await init();
  const tx = await cwDebugQueryAssets(address);
  return { tx, owner };
};

export {
  deposit,
  withdraw,
  grantStakeAuth,
  debugQueryBank,
  queryPoolsAndUsers,
  debugQueryPoolsAndUsers,
  debugQueryAssets,
};