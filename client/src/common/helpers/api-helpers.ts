import { l, createRequest, getLast } from "../utils";
import { Coin, coin } from "@cosmjs/stargate";
import { DENOMS } from "../helpers/assets";
import { chains as chainRegistryList } from "chain-registry";
import { getSgClient } from "../signers";
import {
  PoolExtracted,
  QueryPoolsAndUsersResponse,
} from "../codegen/Starbound.types";
import {
  RelayerStruct,
  PoolDatabase,
  ChainsResponse,
  ChainResponse,
  BalancesResponse,
  DelegationsResponse,
  ValidatorListResponse,
  ValidatorResponse,
  ValidatorResponseReduced,
  IbcResponse,
  NetworkData,
  AssetList,
  AssetDescription,
  NetworkContentResponse,
  ChainRegistryStorage,
  IbcChannelsStorage,
  PoolsStorage,
  ClientStruct,
  PoolsAndUsersStorage,
} from "./interfaces";

const req = createRequest({});

// allows to get 1 working rest from chain registry rest list for single network
async function _verifyRest(restList: string[]) {
  let urlList: string[] = [];

  for (let rest of restList) {
    // check if we got rest with port
    const restParts = rest.split(":");
    if (restParts.length === 3) {
      rest = `${restParts[0]}:${restParts[1]}`;
    }

    // remove '/' if it's found
    const lastCharIndex = rest.length - 1;
    if (rest.slice(lastCharIndex) === "/") {
      rest = rest.slice(0, lastCharIndex);
    }

    urlList.push(rest);
  }

  let urlChecked: string | undefined;
  let promiseList: Promise<void>[] = [];

  for (let url of urlList) {
    // query bank module params to check if url is fine
    const fn = async () => {
      const testUrl = `${url}/cosmos/bank/v1beta1/params`;
      await req.get(testUrl);
      urlChecked = url;
    };

    promiseList.push(fn());
  }

  try {
    await Promise.any(promiseList);
  } catch (error) {}

  return urlChecked;
}

// allows to get 1 working rest from chain registry rest list for all networks
async function _verifyRestList(
  prefixAndRestList: [string, string, string[]][]
) {
  let resultList: [string, string, string | undefined][] = [];
  let promiseList: Promise<void>[] = [];

  for (let [prefix, chainType, restList] of prefixAndRestList) {
    const fn = async () => {
      try {
        const restChecked = await _verifyRest(restList);
        resultList.push([prefix, chainType, restChecked]);
      } catch (error) {}
    };

    promiseList.push(fn());
  }

  await Promise.all(promiseList);

  return resultList;
}

// allows to get 1 working rpc from chain registry rpc list for single network
async function _verifyRpc(rpcList: string[], prefix: string, seed: string) {
  const portList = ["443", "26657"];
  let urlList: string[] = [];

  for (let rpc of rpcList) {
    // check if we got rpc with port
    if (rpc.split(":").length === 3) {
      urlList.push(rpc);
      continue;
    }

    // remove '/' if it's found
    const lastCharIndex = rpc.length - 1;
    if (rpc.slice(lastCharIndex) === "/") {
      rpc = rpc.slice(0, lastCharIndex);
    }

    for (let port of portList) {
      urlList.push(`${rpc}:${port}`);
    }
  }

  let urlChecked: string | undefined;
  let promiseList: Promise<void>[] = [];

  for (let url of urlList) {
    const clientStruct: ClientStruct = {
      isKeplrType: false,
      RPC: url,
      prefix,
      seed,
    };

    // query balances to check if url is fine
    const fn = async () => {
      const { client, owner } = await getSgClient(clientStruct);
      await client.getAllBalances(owner);
      urlChecked = url;
    };

    promiseList.push(fn());
  }

  try {
    await Promise.any(promiseList);
  } catch (error) {}

  return urlChecked;
}

// allows to get 1 working rpc from chain registry rpc list for all networks
async function _verifyRpcList(
  prefixAndRpcList: [string, string, string[]][],
  seed: string
) {
  let resultList: [string, string, string | undefined][] = [];

  // for some reasons Promise.all returns array of undefined
  // so sequential requests must be used here
  for (let [prefix, chainType, rpcList] of prefixAndRpcList) {
    try {
      const rpcChecked = await _verifyRpc(rpcList, prefix, seed);
      resultList.push([prefix, chainType, rpcChecked]);
    } catch (error) {}
  }

  return resultList;
}

async function _queryMainnetNames() {
  try {
    const mainnetContentResponseList: NetworkContentResponse[] = await req.get(
      "https://api.github.com/repos/cosmos/chain-registry/contents"
    );

    let names: string[] = [];

    for (let { name: rawName } of mainnetContentResponseList) {
      const code = rawName.charCodeAt(0);

      if (
        !rawName.includes(".") &&
        rawName !== "testnets" &&
        code >= 97 &&
        code < 123
      ) {
        names.push(rawName);
      }
    }

    return names;
  } catch (error) {
    l(error);
    return [];
  }
}

async function _queryTestnetNames() {
  try {
    const testnetContentResponseList: NetworkContentResponse[] = await req.get(
      "https://api.github.com/repos/cosmos/chain-registry/contents/testnets"
    );

    return testnetContentResponseList.map(({ name }) => name);
  } catch (error) {
    l(error);
    return [];
  }
}

async function _queryNetworkNames() {
  const promises = [_queryMainnetNames(), _queryTestnetNames()];
  const [main, test] = await Promise.all(promises);
  return { main, test };
}

async function _mainnetQuerier(chainUrl: string, assetListUrl: string) {
  let data: NetworkData = {
    prefix: "",
    main: undefined,
    test: undefined,
    img: "",
    symbol: "",
    denomNative: "",
    denomIbc: "",
    exponent: 0,
    coinGeckoId: undefined,
  };

  let promises: [Promise<ChainResponse>, Promise<AssetList>] = [
    req.get(chainUrl),
    req.get(assetListUrl),
  ];

  try {
    let [chainRes, assetListRes] = await Promise.all(promises);
    let { logo_URIs, symbol, denom_units, coingecko_id } =
      assetListRes.assets[0];
    let imgUrl = logo_URIs?.svg || logo_URIs.png;
    let { exponent } = getLast(denom_units);
    let { denom } = denom_units[0];

    data = {
      ...data,
      prefix: chainRes.bech32_prefix,
      main: chainRes,
      img: imgUrl,
      symbol,
      denomNative: denom,
      exponent,
      coinGeckoId: coingecko_id,
    };
  } catch (error) {}

  return data;
}

async function _testnetQuerier(chainUrl: string) {
  let data: NetworkData = {
    prefix: "",
    main: undefined,
    test: undefined,
    img: "",
    symbol: "",
    denomNative: "",
    denomIbc: "",
    exponent: 0,
    coinGeckoId: undefined,
  };

  try {
    let chainRes: ChainResponse = await req.get(chainUrl);

    data = {
      ...data,
      prefix: chainRes.bech32_prefix,
      test: chainRes,
    };
  } catch (error) {}

  return data;
}

async function _queryNetworksData(
  mainList: string[],
  testList: string[],
  seed: string
) {
  let promises: Promise<NetworkData>[] = [];

  for (let chainName of mainList) {
    let chainUrl = `https://raw.githubusercontent.com/cosmos/chain-registry/master/${chainName}/chain.json`;
    let assetListUrl = `https://raw.githubusercontent.com/cosmos/chain-registry/master/${chainName}/assetlist.json`;
    promises.push(_mainnetQuerier(chainUrl, assetListUrl));
  }

  for (let chainName of testList) {
    let chainUrl = `https://raw.githubusercontent.com/cosmos/chain-registry/master/testnets/${chainName}/chain.json`;
    promises.push(_testnetQuerier(chainUrl));
  }

  let rawNetworkData = await Promise.all(promises);

  let networkData = rawNetworkData.filter((item) => item.main);
  let testnetData = rawNetworkData.filter((item) => item.test);

  for (let networkDataItem of networkData) {
    for (let testnetDataItem of testnetData) {
      if (networkDataItem.prefix === testnetDataItem.prefix) {
        networkDataItem.test = testnetDataItem.test;
      }
    }
  }

  // update rpc and rest lists with their verified versions
  let prefixAndRpcList: [string, string, string[]][] = [];
  let prefixAndRestList: [string, string, string[]][] = [];

  for (let { prefix, main, test } of networkData) {
    if (main) {
      const chainType = "main";
      const rpcList = (main?.apis?.rpc || []).map(({ address }) => address);
      const restList = (main?.apis?.rest || []).map(({ address }) => address);
      prefixAndRpcList.push([prefix, chainType, rpcList]);
      prefixAndRestList.push([prefix, chainType, restList]);
    }

    if (test) {
      const chainType = "test";
      const rpcList = (test?.apis?.rpc || []).map(({ address }) => address);
      const restList = (test?.apis?.rest || []).map(({ address }) => address);
      prefixAndRpcList.push([prefix, chainType, rpcList]);
      prefixAndRestList.push([prefix, chainType, restList]);
    }
  }

  const [prefixAndRpcChecked, prefixAndRestChecked] = await Promise.all([
    _verifyRpcList(prefixAndRpcList, seed),
    _verifyRestList(prefixAndRestList),
  ]);

  let networkDataChecked: NetworkData[] = [];

  for (let networkDataItem of networkData) {
    const { prefix, main, test } = networkDataItem;
    const provider = "Starbound";
    let mainChecked = main;
    let testChecked = test;

    const rpcListChecked = prefixAndRpcChecked.filter(([p]) => p === prefix);
    const restListChecked = prefixAndRestChecked.filter(([p]) => p === prefix);

    if (main) {
      const chainType = "main";
      const rpcMain = rpcListChecked.find(([p, c]) => c === chainType);
      const restMain = restListChecked.find(([p, c]) => c === chainType);

      const rpcAddress = rpcMain?.[2];
      const rpcMainChecked = rpcAddress
        ? [{ address: rpcAddress, provider }]
        : [];

      const restAddress = restMain?.[2];
      const restMainChecked = restAddress
        ? [{ address: restAddress, provider }]
        : [];

      const { apis } = main;
      mainChecked = {
        ...main,
        apis: { ...apis, rpc: rpcMainChecked, rest: restMainChecked },
      };
    }

    if (test) {
      const chainType = "test";
      const rpcTest = rpcListChecked.find(([p, c]) => c === chainType);
      const restTest = restListChecked.find(([p, c]) => c === chainType);

      const rpcAddress = rpcTest?.[2];
      const rpcTestChecked = rpcAddress
        ? [{ address: rpcAddress, provider }]
        : [];

      const restAddress = restTest?.[2];
      const restTestChecked = restAddress
        ? [{ address: restAddress, provider }]
        : [];

      const { apis } = test;
      testChecked = {
        ...test,
        apis: { ...apis, rpc: rpcTestChecked, rest: restTestChecked },
      };
    }

    networkDataChecked.push({
      ...networkDataItem,
      main: mainChecked,
      test: testChecked,
    });
  }

  return networkDataChecked;
}

async function getChainRegistry(seed: string) {
  const { main, test } = await _queryNetworkNames();
  return await _queryNetworksData(main, test, seed);
}

function mergeChainRegistry(
  chainRegistryStorage: ChainRegistryStorage | undefined,
  chainRegistryResponse: NetworkData[]
) {
  if (!chainRegistryStorage) return chainRegistryResponse;

  for (let resItem of chainRegistryResponse) {
    // replace item if it's found in storage or add a new
    chainRegistryStorage = [
      ...chainRegistryStorage.filter(({ prefix }) => prefix !== resItem.prefix),
      resItem,
    ];
  }

  return chainRegistryStorage;
}

function mergeIbcChannels(
  ibcChannelsStorage: IbcChannelsStorage | undefined,
  ibcChannelsResponse: IbcResponse[]
) {
  if (!ibcChannelsStorage) return ibcChannelsResponse;

  for (let resItem of ibcChannelsResponse) {
    // replace item if it's found in storage or add a new
    ibcChannelsStorage = [
      ...ibcChannelsStorage.filter(
        ({ destination }) => destination !== resItem.destination
      ),
      resItem,
    ];
  }

  return ibcChannelsStorage;
}

function mergePools(
  poolsStorage: PoolsStorage | undefined,
  poolsResponse: [string, AssetDescription[]][]
) {
  if (!poolsStorage) return poolsResponse;

  for (let resItem of poolsResponse) {
    // replace item if it's found in storage or add a new
    poolsStorage = [
      ...poolsStorage.filter(([k, v]) => k !== resItem[0]),
      resItem,
    ];
  }

  return poolsStorage;
}

async function getIbcChannnels() {
  //const url = "https://api-osmosis.imperator.co/ibc/v1/info";
  const url = "https://api-osmosis.imperator.co/ibc/v1/all?dex=osmosis";

  try {
    let channels: IbcResponse[] = await req.get(url);
    let fromOsmoChannels: IbcResponse[] = [];
    let toOsmoChannels: string[] = [];

    // split channels by direction
    for (let item of channels) {
      let { size_queue, token_symbol, source } = item;
      if (size_queue >= 5) continue; // allow using channels with some txs in queue
      if (token_symbol === "OSMO") fromOsmoChannels.push(item);
      else toOsmoChannels.push(source);
    }

    // use bidirectional channels
    return fromOsmoChannels.filter(({ destination }) =>
      toOsmoChannels.includes(destination)
    );
  } catch (error) {
    return [];
  }
}

async function requestRelayers(): Promise<RelayerStruct[]> {
  const url = "https://api-osmosis.imperator.co/ibc/v1/all?dex=osmosis";

  let relayerStructList: RelayerStruct[] = [];
  let ibcResponseList: IbcResponse[] = []; // from osmo channels only
  let poolList: [string, AssetDescription[]][] = [];
  let channels: IbcResponse[] = []; // all channels

  await Promise.all([
    (async () => {
      try {
        ibcResponseList = await getIbcChannnels();
      } catch (error) {}
    })(),
    (async () => {
      try {
        poolList = await getPools();
      } catch (error) {}
    })(),
    (async () => {
      try {
        channels = await req.get(url);
      } catch (error) {}
    })(),
  ]);

  for (let [k, [{ symbol, denom }, v1]] of poolList) {
    if (v1.symbol !== "OSMO") continue;

    const toOsmoChannel = channels.find(
      ({ token_symbol }) => token_symbol === symbol
    );
    if (!toOsmoChannel) continue;

    const fromOsmoChannel = ibcResponseList.find(
      ({ destination }) => destination === toOsmoChannel.source
    );
    if (!fromOsmoChannel) continue;

    const { destination, channel_id } = fromOsmoChannel;
    relayerStructList.push({
      chain_id: destination,
      channel_id,
      port_id: "transfer",
      denom,
      symbol,
    });
  }

  return relayerStructList;
}

async function getPools() {
  const url =
    "https://api-osmosis.imperator.co/pools/v2/all?low_liquidity=false";

  // download pools info
  let poolDatabase: PoolDatabase = await req.get(url);

  // skip low liquidity pools
  let valid_pools = Object.entries(poolDatabase).filter(
    ([_, [v0]]) => v0.liquidity > 1_000
  );

  return valid_pools;
}

function filterChainRegistry(
  chainRegistry: NetworkData[] | undefined,
  ibcChannels: IbcResponse[] | undefined,
  pools: [string, AssetDescription[]][] | undefined,
  validators: [string, ValidatorResponseReduced[]][] | undefined
): {
  chainRegistry: NetworkData[];
  ibcChannels: IbcResponse[];
  pools: [string, AssetDescription[]][];
  activeNetworks: PoolExtracted[];
} {
  if (!chainRegistry || !ibcChannels || !pools || !validators) {
    return {
      chainRegistry: chainRegistry || [],
      ibcChannels: ibcChannels || [],
      pools: pools || [],
      activeNetworks: [],
    };
  }

  const ibcChannelDestinations = ibcChannels.map(
    ({ destination }) => destination
  );
  const osmoPools = pools.filter(([k, [v1, v2]]) => v2.symbol === "OSMO");

  const poolSymbols = osmoPools.map(([k, [v1, v2]]) => v1.symbol);

  const validatorsChains = validators.map((item) => item[0]);

  let chainRegistryFiltered = chainRegistry.filter(({ symbol, main }) => {
    if (!main) return false;
    return (
      ibcChannelDestinations.includes(main.chain_id) &&
      poolSymbols.includes(symbol) &&
      validatorsChains.includes(main.chain_name)
    );
  });

  const osmoChainRegistry = chainRegistry.find(
    ({ symbol }) => symbol === "OSMO"
  );
  if (typeof osmoChainRegistry !== "undefined") {
    chainRegistryFiltered.push(osmoChainRegistry);
  }

  chainRegistryFiltered = chainRegistryFiltered.sort((a, b) =>
    a.symbol > b.symbol ? 1 : -1
  );

  const chainRegistryFilteredSymbols = chainRegistryFiltered.map(
    ({ symbol }) => symbol
  );

  const chainRegistryFilteredDestinations = chainRegistryFiltered.map(
    ({ main }) => {
      if (!main) return "";
      return main.chain_id;
    }
  );

  const ibcChannelsFiltered = ibcChannels.filter(({ destination }) =>
    chainRegistryFilteredDestinations.includes(destination)
  );

  const poolsFiltered = osmoPools.filter(([k, [v1, v2]]) =>
    chainRegistryFilteredSymbols.includes(v1.symbol)
  );

  let activeNetworks: PoolExtracted[] = [];

  for (let chainRegistry of chainRegistryFiltered) {
    const { main } = chainRegistry;
    if (!main) continue;

    const pool = poolsFiltered.find(
      ([k, [v1, v2]]) => v1.symbol === chainRegistry.symbol
    );
    if (!pool) continue;
    const [key, [v0, v1]] = pool;

    const ibcChannel = ibcChannelsFiltered.find(
      ({ destination }) => destination === main.chain_id
    );
    if (!ibcChannel) continue;

    activeNetworks.push({
      channel_id: ibcChannel.channel_id,
      denom: v0.denom,
      id: key,
      port_id: "transfer",
      price: v0.price.toString(),
      symbol: chainRegistry.symbol,
    });
  }

  chainRegistryFiltered = chainRegistryFiltered.map((item) => {
    const pool = poolsFiltered.find(
      ([k, [v0, v1]]) => v0.symbol === item.symbol
    );
    if (!pool) return item;

    const [k, [v0, v1]] = pool;

    return { ...item, denomIbc: v0.denom };
  });

  return {
    chainRegistry: chainRegistryFiltered,
    ibcChannels: ibcChannelsFiltered,
    pools: poolsFiltered,
    activeNetworks,
  };
}

// merge requestRelayers with requestPools to validate asset symbols
// and filter IBC active networks
async function getActiveNetworksInfo(): Promise<PoolExtracted[]> {
  let relayers = await requestRelayers();
  let pools = await getPools();

  let temp: PoolExtracted[] = [];

  for (let [key, [v0, v1]] of pools) {
    if (v1.denom !== "uosmo") continue;

    for (let relayer of relayers) {
      if (relayer.symbol === v0.symbol) {
        temp.push({
          channel_id: relayer.channel_id,
          denom: v0.denom,
          id: key,
          port_id: relayer.port_id,
          price: v0.price.toString(),
          symbol: v0.coingecko_id || v0.symbol,
        });
      }
    }
  }

  return temp;
}

async function updatePoolsAndUsers(response: QueryPoolsAndUsersResponse) {
  let { pools, users } = response;

  let poolsData = await getActiveNetworksInfo();

  for (let pool of pools) {
    for (let poolsDataItem of poolsData) {
      if (pool.denom === poolsDataItem.denom) {
        pool.price = poolsDataItem.price;
      }
    }
  }

  let usersFundsList = await getUserFunds(response);

  for (let user of users) {
    for (let asset of user.asset_list) {
      for (let userFunds of usersFundsList) {
        let { address, holded, staked } = userFunds;

        if (asset.wallet_address === address) {
          asset.wallet_balance = (+holded.amount + +staked.amount).toString();
        }
      }
    }
  }

  l({ fn: "updatePoolsAndUsers", pools, users: users[0].asset_list });
  return { pools, users };
}

async function mockUpdatePoolsAndUsers(): Promise<QueryPoolsAndUsersResponse> {
  let data = {
    pools: [
      {
        id: "1",
        denom:
          "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2",
        price: "11.5",
        symbol: "uatom",
        channel_id: "channel-0",
        port_id: "transfer",
      },
      {
        id: "497",
        denom:
          "ibc/46B44899322F3CD854D2D46DEEF881958467CDD4B3B10086DA49296BBED94BED",
        price: "3.5",
        symbol: "ujuno",
        channel_id: "channel-1110",
        port_id: "transfer",
      },
      {
        id: "481",
        denom:
          "ibc/5973C068568365FFF40DEDCF1A1CB7582B6116B731CD31A12231AE25E20B871F",
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
            asset_denom: DENOMS.ATOM,
            wallet_address: "cosmos1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyklkm75",
            wallet_balance: "100",
          },

          {
            asset_denom: DENOMS.JUNO,
            wallet_address: "juno1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyqd4qeg",
            wallet_balance: "200",
          },
        ],
      },
    ],
  };

  return new Promise((res) => res(data));
}

function _getDelegationsUrl(chain: string, address: string) {
  let url = `https://api-${chain}-ia.cosmosia.notional.ventures/cosmos/staking/v1beta1/delegations/${address}`;
  return url;
}

function _getBalanceUrl(chain: string, address: string) {
  let url = `https://api-${chain}-ia.cosmosia.notional.ventures/cosmos/bank/v1beta1/balances/${address}`;
  return url;
}

async function getUserFunds(
  queryPoolsAndUsersResponse: QueryPoolsAndUsersResponse | undefined
) {
  if (!queryPoolsAndUsersResponse) return [];

  // request chain list
  let baseUrl = "https://cosmos-chain.directory/chains/";
  let { chains }: ChainsResponse = await req.get(baseUrl);
  chains = chains.filter((chain) => chain !== "testnets");

  // iterate over chain list
  let chainPromises: Promise<[string, string]>[] = [];

  async function _requestChain(chain: string): Promise<[string, string]> {
    try {
      let res: ChainResponse = await req.get(baseUrl + chain);
      return [chain, res.bech32_prefix];
    } catch (error) {
      return ["", ""];
    }
  }

  for (let chain of chains) {
    chainPromises.push(_requestChain(chain));
  }

  let prefixes: [string, string][] = await Promise.all(chainPromises);
  prefixes = prefixes
    .filter(([a, b]) => a !== "" || b !== "")
    .map(([a, b]) => {
      if (a === "likecoin") return [a, "like"]; // fix likecoin bech32prefix
      return [a, b];
    });

  const { users } = queryPoolsAndUsersResponse;

  // transform {osmoAddr, {address, holded, staked}[]}[] nested structure
  // to {chain, osmoAddr, address, holded, staked}[] flat structure
  let userAdressesWithBalancesPromises: Promise<{
    chain: string;
    osmoAddr: string;
    address: string;
    holded: Coin;
    staked: Coin;
  }>[] = [];

  for (let { osmo_address, asset_list } of users) {
    for (let { wallet_address } of asset_list) {
      for (let [chain, prefix] of prefixes) {
        let walletAddressPrefix = wallet_address.split("1")[0];
        if (walletAddressPrefix === prefix) {
          let getPromise = async () => {
            let balance: BalancesResponse = {
              balances: [],
              pagination: { next_key: null, total: "1" },
            };
            let delegation: DelegationsResponse = {
              delegation_responses: [],
              pagination: { next_key: null, total: "1" },
            };

            try {
              await Promise.all([
                (async () => {
                  try {
                    balance = await req.get(
                      _getBalanceUrl(chain, wallet_address)
                    );
                  } catch (error) {}
                })(),

                (async () => {
                  try {
                    delegation = await req.get(
                      _getDelegationsUrl(chain, wallet_address)
                    );
                  } catch (error) {}
                })(),
              ]);

              let denom =
                chainRegistryList.find(({ chain_name }) => chain_name === chain)
                  ?.fees?.fee_tokens[0].denom || "ucosm";
              let balanceHolded =
                balance.balances.find((coin) => coin.denom === denom)?.amount ||
                "0";
              let balanceStaked =
                delegation?.delegation_responses[0]?.balance.amount || "0";

              return {
                chain,
                osmoAddr: osmo_address,
                address: wallet_address,
                holded: coin(balanceHolded, denom),
                staked: coin(balanceStaked, denom),
              };
            } catch (error) {
              return {
                chain,
                osmoAddr: osmo_address,
                address: wallet_address,
                holded: coin(0, "ucosm"),
                staked: coin(0, "ucosm"),
              };
            }
          };

          userAdressesWithBalancesPromises.push(getPromise());
        }
      }
    }
  }

  return await Promise.all(userAdressesWithBalancesPromises);
}

function _getValidatorListUrl(chain: string) {
  let url = `https://api-${chain}-ia.cosmosia.notional.ventures/cosmos/staking/v1beta1/validators?pagination.limit=200&status=BOND_STATUS_BONDED`;
  return url;
}

async function getValidators(prefixAndRestList: [string, string][]) {
  // request chain list
  let baseUrl = "https://cosmos-chain.directory/chains/";
  let { chains }: ChainsResponse = await req.get(baseUrl);
  chains = chains.filter((chain) => chain !== "testnets");

  let validatorListPromises: Promise<[string, ValidatorResponse[]]>[] = [];

  async function _requestValidatorList(
    chain: string
  ): Promise<[string, ValidatorResponse[]]> {
    let url = _getValidatorListUrl(chain);
    try {
      let res: ValidatorListResponse = await req.get(url);

      return [chain, res.validators];
    } catch (error) {
      return [chain, []];
    }
  }

  for (let chain of chains) {
    validatorListPromises.push(_requestValidatorList(chain));
  }

  let validatorList: [string, ValidatorResponse[]][] = await Promise.all(
    validatorListPromises
  );

  validatorList = validatorList.filter(([_, b]) => b.length);

  const validatorListReduced: [string, ValidatorResponseReduced[]][] =
    validatorList.map(([symbol, vals]) => {
      const valsReduced: ValidatorResponseReduced[] = vals.map((val) => ({
        operator_address: val.operator_address,
        moniker: val.description.moniker,
      }));
      return [symbol, valsReduced];
    });

  return validatorListReduced;
}

async function _getValidatorsNew(rest: string) {
  const [a, b] = rest.split(":");
  const url = `${a}:${b}/cosmos/staking/v1beta1/validators`;

  try {
    const res: ValidatorListResponse = await req.get(url);

    return res.validators
      .filter(({ jailed }) => !jailed)
      .map(({ operator_address, description: { moniker } }) => ({
        operator_address,
        moniker: moniker.trim(),
      }));
  } catch (error) {
    return [];
  }
}

// async function getValidators(
//   prefixAndRestList: [string, string][]
// ): Promise<[string, ValidatorResponseReduced[]][]> {
//   let validatorList: [string, ValidatorResponseReduced[]][] = [];
//   let promiseList: Promise<void>[] = [];

//   for (let [prefix, rest] of prefixAndRestList) {
//     const fn = async () => {
//       validatorList.push([prefix, await _getValidatorsNew(rest)]);
//     };

//     promiseList.push(fn());
//   }

//   await Promise.all(promiseList);

//   return validatorList;
// }

function getPrefixAndRestList(
  chainRegistryStorage: ChainRegistryStorage | undefined,
  chainType: "main" | "test"
): [string, string][] {
  if (!chainRegistryStorage) return [];

  let prefixAndRestList: [string, string][] = [];

  for (let { prefix, main, test } of chainRegistryStorage) {
    if (chainType === "main" && main) {
      const rest = main?.apis?.rest || [];
      if (!rest.length) {
        continue;
      }
      prefixAndRestList.push([prefix, rest[0].address]);
    }

    if (chainType === "test" && test) {
      const rest = test?.apis?.rest || [];
      if (!rest.length) {
        continue;
      }
      prefixAndRestList.push([prefix, rest[0].address]);
    }
  }

  return prefixAndRestList;
}

export {
  updatePoolsAndUsers,
  mockUpdatePoolsAndUsers,
  getChainRegistry,
  getIbcChannnels,
  getPools,
  getValidators,
  getUserFunds,
  filterChainRegistry,
  mergeChainRegistry,
  mergeIbcChannels,
  mergePools,
  _verifyRpc,
  _verifyRpcList,
  _getValidatorsNew,
  _verifyRest,
  _verifyRestList,
  getPrefixAndRestList,
};
