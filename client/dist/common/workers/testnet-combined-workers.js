"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const utils_1 = require("../utils");
const cw_helpers_1 = require("../helpers/cw-helpers");
const assets_1 = require("../helpers/assets");
const sg_helpers_1 = require("../helpers/sg-helpers");
const testnet_config_json_1 = require("../config/testnet-config.json");
const aliceClientStruct = {
    isKeplrType: false,
    prefix: testnet_config_json_1.PREFIX,
    RPC: testnet_config_json_1.RPC,
    seed: testnet_config_json_1.SEED_ALICE,
};
const bobClientStruct = {
    isKeplrType: false,
    prefix: testnet_config_json_1.PREFIX,
    RPC: testnet_config_json_1.RPC,
    seed: testnet_config_json_1.SEED_BOB,
};
const dappClientStruct = {
    isKeplrType: false,
    prefix: testnet_config_json_1.PREFIX,
    RPC: testnet_config_json_1.RPC,
    seed: testnet_config_json_1.SEED_DAPP,
};
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        // alice cosmwasm helpers
        const { owner: aliceAddr, _cwDeposit, _cwDepositNew: _cwDepositAlice, _cwWithdrawNew: _cwWithdrawAlice, } = yield (0, cw_helpers_1.getCwHelpers)(aliceClientStruct, testnet_config_json_1.CONTRACT_ADDRESS);
        // bob cosmwasm helpers
        const { owner: bobAddr, _cwDepositNew: _cwDepositBob } = yield (0, cw_helpers_1.getCwHelpers)(bobClientStruct, testnet_config_json_1.CONTRACT_ADDRESS);
        // dapp cosmwasm helpers
        const { owner: dappAddr, _cwSwap, _cwGetPools, _cwGetPrices, _cwQueryPoolsAndUsers, _cwDebugQueryPoolsAndUsers, _cwUpdatePoolsAndUsers, _cwQueryAssets, _cwDebugQueryBank, _cwTransfer, } = yield (0, cw_helpers_1.getCwHelpers)(dappClientStruct, testnet_config_json_1.CONTRACT_ADDRESS);
        // alice stargate helpers
        const { _sgGrantStakeAuth, _sgTransfer } = yield (0, sg_helpers_1.getSgHelpers)(aliceClientStruct);
        // dapp stargate helpers
        const { _sgDelegateFrom, _sgGetTokenBalances, _sgUpdatePoolList } = yield (0, sg_helpers_1.getSgHelpers)(dappClientStruct);
        function sgUpdatePoolList() {
            return __awaiter(this, void 0, void 0, function* () {
                let pools = yield _sgUpdatePoolList();
                (0, utils_1.l)({ pools });
            });
        }
        function _queryBalance() {
            return __awaiter(this, void 0, void 0, function* () {
                let balances = yield _sgGetTokenBalances(testnet_config_json_1.CONTRACT_ADDRESS);
                (0, utils_1.l)({ contract: balances });
            });
        }
        function cwDeposit() {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)(utils_1.SEP, "depositing...");
                try {
                    yield _cwDeposit(10000);
                    // await _queryBalance();
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        const grantStakeStruct = {
            targetAddr: dappAddr,
            tokenAmount: 5000,
            tokenDenom: assets_1.DENOMS.OSMO,
            validatorAddr: "osmovaloper1c584m4lq25h83yp6ag8hh4htjr92d954kphp96",
        };
        function sgGrantStakeAuth() {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)(utils_1.SEP, "granting staking permission...");
                try {
                    const tx = yield _sgGrantStakeAuth(grantStakeStruct);
                    (0, utils_1.l)(tx, "\n");
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        // const swapStruct: SwapStruct = {
        //   from: "OSMO",
        //   to: "ATOM",
        //   amount: 1_000,
        // };
        // async function cwSwap() {
        //   l(SEP, "executing swap...");
        //   try {
        //     await _cwSwap(swapStruct);
        //     await _queryBalance();
        //   } catch (error) {
        //     l(error, "\n");
        //   }
        // }
        const stakeFromStruct = {
            targetAddr: aliceAddr,
            tokenAmount: 1000,
            tokenDenom: assets_1.DENOMS.OSMO,
            validatorAddr: "osmovaloper1c584m4lq25h83yp6ag8hh4htjr92d954kphp96",
        };
        function sgDelegateFrom() {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)(utils_1.SEP, "delegating from...");
                try {
                    const tx = yield _sgDelegateFrom(stakeFromStruct);
                    (0, utils_1.l)(tx, "\n");
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function cwGetPools() {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)(utils_1.SEP, "querying pools...");
                try {
                    yield _cwGetPools();
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function cwGetPrices() {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)(utils_1.SEP, "querying prices...");
                try {
                    yield _cwGetPrices();
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function cwDebugQueryPoolsAndUsers() {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)(utils_1.SEP, "debug querying pools and users...");
                try {
                    yield _cwDebugQueryPoolsAndUsers();
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function cwQueryPoolsAndUsers() {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)(utils_1.SEP, "querying pools and users...");
                try {
                    return yield _cwQueryPoolsAndUsers();
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                    let empty = { pools: [], users: [] };
                    return empty;
                }
            });
        }
        let assetListAlice = [
            // ATOM
            {
                asset_denom: assets_1.DENOMS.ATOM,
                wallet_address: "cosmos1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyklkm75",
                wallet_balance: "0",
                weight: "0.5",
                amount_to_send_until_next_epoch: "0",
            },
            // JUNO
            {
                asset_denom: assets_1.DENOMS.JUNO,
                wallet_address: "juno1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyqd4qeg",
                wallet_balance: "0",
                weight: "0.5",
                amount_to_send_until_next_epoch: "0",
            },
        ];
        let userAlice = {
            asset_list: assetListAlice,
            day_counter: "3",
            deposited_on_current_period: `${1000000}`,
            deposited_on_next_period: "0",
            is_controlled_rebalancing: false,
        };
        function cwDepositAlice() {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)(utils_1.SEP, "alice depositing...");
                try {
                    yield _cwDepositAlice(userAlice);
                    // await _queryBalance();
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        let assetListBob = [
            // ATOM
            {
                asset_denom: assets_1.DENOMS.ATOM,
                wallet_address: "cosmos1chgwz55h9kepjq0fkj5supl2ta3nwu63327q35",
                wallet_balance: "10000000",
                weight: "0.3",
                amount_to_send_until_next_epoch: "0",
            },
            // JUNO
            {
                asset_denom: assets_1.DENOMS.JUNO,
                wallet_address: "juno1chgwz55h9kepjq0fkj5supl2ta3nwu638camkg",
                wallet_balance: "10000000",
                weight: "0.7",
                amount_to_send_until_next_epoch: "0",
            },
        ];
        let userBob = {
            asset_list: assetListBob,
            day_counter: "3",
            deposited_on_current_period: `${600000}`,
            deposited_on_next_period: "0",
            is_controlled_rebalancing: false, // TODO: try true
        };
        function cwDepositBob() {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)(utils_1.SEP, "bob depositing...");
                try {
                    yield _cwDepositBob(userBob);
                    // await _queryBalance();
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function cwWithdrawAlice() {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)(utils_1.SEP, "alice withdrawing...");
                try {
                    yield _cwWithdrawAlice(100000);
                    // await _queryBalance();
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function cwMockUpdatePoolsAndUsers() {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)(utils_1.SEP, "updating pools and users...");
                try {
                    let data = {
                        pools: [
                            {
                                id: "1",
                                denom: "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2",
                                price: "11.5",
                                symbol: "uatom",
                                channel_id: "channel-1110",
                                port_id: "transfer",
                            },
                            {
                                id: "497",
                                denom: "ibc/46B44899322F3CD854D2D46DEEF881958467CDD4B3B10086DA49296BBED94BED",
                                price: "3.5",
                                symbol: "ujuno",
                                channel_id: "channel-1110",
                                port_id: "transfer",
                            },
                            {
                                id: "481",
                                denom: "ibc/5973C068568365FFF40DEDCF1A1CB7582B6116B731CD31A12231AE25E20B871F",
                                price: "1",
                                symbol: "debug_ueeur",
                                channel_id: "debug_ch_id",
                                port_id: "transfer",
                            },
                        ],
                        users: [
                            {
                                osmo_address: "osmo1gjqnuhv52pd2a7ets2vhw9w9qa9knyhy7y9tgx",
                                asset_list: [
                                    {
                                        asset_denom: assets_1.DENOMS.ATOM,
                                        wallet_address: "cosmos1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyklkm75",
                                        wallet_balance: "1",
                                    },
                                    {
                                        asset_denom: assets_1.DENOMS.JUNO,
                                        wallet_address: "juno1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyqd4qeg",
                                        wallet_balance: "2",
                                    },
                                ],
                            },
                            {
                                osmo_address: "osmo1chgwz55h9kepjq0fkj5supl2ta3nwu63e3ds8x",
                                asset_list: [
                                    {
                                        asset_denom: assets_1.DENOMS.ATOM,
                                        wallet_address: "cosmos1chgwz55h9kepjq0fkj5supl2ta3nwu63327q35",
                                        wallet_balance: "10000001",
                                    },
                                    {
                                        asset_denom: assets_1.DENOMS.JUNO,
                                        wallet_address: "juno1chgwz55h9kepjq0fkj5supl2ta3nwu638camkg",
                                        wallet_balance: "10000002",
                                    },
                                ],
                            },
                        ],
                    };
                    yield _cwUpdatePoolsAndUsers(data.pools, data.users);
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function cwQueryAssets() {
            return __awaiter(this, void 0, void 0, function* () {
                let aliceAddr = "osmo1gjqnuhv52pd2a7ets2vhw9w9qa9knyhy7y9tgx";
                let bobAddr = "osmo1chgwz55h9kepjq0fkj5supl2ta3nwu63e3ds8x";
                let addresses = [aliceAddr, bobAddr];
                for (let addr of addresses) {
                    (0, utils_1.l)(utils_1.SEP, "query assets...");
                    try {
                        yield _cwQueryAssets(addr);
                    }
                    catch (error) {
                        (0, utils_1.l)(error, "\n");
                    }
                }
            });
        }
        function cwSwap() {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)(utils_1.SEP, "swapping...");
                try {
                    yield _cwSwap();
                    // await _queryBalance();
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function cwDebugQueryBank() {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)(utils_1.SEP, "debug querying bank...");
                try {
                    yield _cwDebugQueryBank();
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        function cwTransfer() {
            return __awaiter(this, void 0, void 0, function* () {
                (0, utils_1.l)(utils_1.SEP, "transfering...");
                try {
                    yield _cwTransfer();
                    // await _queryBalance();
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        const ibcStruct = {
            amount: 1000,
            dstPrefix: "juno",
            sourceChannel: "channel-1110",
            sourcePort: "transfer",
        };
        function sgTransfer() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    let tx = yield _sgTransfer(ibcStruct);
                    (0, utils_1.l)(tx);
                }
                catch (error) {
                    (0, utils_1.l)(error, "\n");
                }
            });
        }
        return {
            _queryBalance,
            cwDeposit,
            sgGrantStakeAuth,
            cwSwap,
            sgDelegateFrom,
            sgUpdatePoolList,
            cwGetPools,
            cwGetPrices,
            cwDebugQueryPoolsAndUsers,
            cwQueryPoolsAndUsers,
            cwDepositAlice,
            cwDepositBob,
            cwWithdrawAlice,
            cwMockUpdatePoolsAndUsers,
            cwQueryAssets,
            cwDebugQueryBank,
            cwTransfer,
            sgTransfer,
        };
    });
}
exports.init = init;
