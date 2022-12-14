<script lang="ts">
  import { Doughnut } from "svelte-chartjs";
  import Decimal from "decimal.js";
  import { l } from "../../../common/utils";
  import { type DashboardAsset } from "../../../common/helpers/interfaces";
  import {
    getAssetInfoByAddress,
    trimPrice,
    generateColorList,
  } from "../services/helpers";
  import {
    STABLECOIN_SYMBOL,
    STABLECOIN_EXPONENT,
    userFundsStorage,
    userContractStorage,
  } from "../services/storage";
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    CategoryScale,
  } from "chart.js";

  // TODO: solve the problem when chart and table doesn't appears immidiately on the page
  // after updating data in contract via deposit
  let paymentBalance = 0;
  let portfolioNetWorth = 0;

  let dashboardAssetList: DashboardAsset[] = [];

  let data: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string[];
      hoverBackgroundColor: string[];
    }[];
  };

  let options = {
    responsive: true,
    radius: "90%",
  };

  // displays contract data
  userContractStorage.subscribe((user) => {
    paymentBalance = +(user?.deposited || "") / 10 ** STABLECOIN_EXPONENT;
  });

  // displays mainnet balances
  userFundsStorage.subscribe((value) => {
    const zero = new Decimal(0);
    const multiplier = new Decimal(100);

    let initialAssetList: DashboardAsset[] = [];

    for (let [addr, { holded: _holded, staked: _staked }] of value) {
      const assetInfoByAddress = getAssetInfoByAddress(addr);
      if (!assetInfoByAddress) continue;

      const {
        asset: { symbol, exponent },
        price: _price,
      } = assetInfoByAddress;

      const price = new Decimal(trimPrice(_price));
      const divider = new Decimal(10 ** exponent);

      const holded = new Decimal(_holded.amount)
        .div(divider)
        .toDecimalPlaces(exponent);
      const staked = new Decimal(_staked.amount)
        .div(divider)
        .toDecimalPlaces(exponent);

      const cost = price.mul(holded.add(staked)).toDecimalPlaces(2);

      let res: DashboardAsset = {
        asset: symbol,
        price,
        holded,
        staked,
        cost,
        allocation: zero,
      };

      initialAssetList.push(res);
    }

    const totalCost = new Decimal(
      initialAssetList
        .map(({ cost }) => cost)
        .reduce((acc, cur) => acc.add(cur), zero)
    );

    portfolioNetWorth = totalCost.toDecimalPlaces(2).toNumber();

    dashboardAssetList = initialAssetList.map((item) => {
      const cost = new Decimal(item.cost);
      const allocation = totalCost.eq(zero)
        ? zero
        : cost.mul(multiplier).div(totalCost).toDecimalPlaces(2);

      return { ...item, allocation };
    });

    data = {
      labels: dashboardAssetList.map(({ asset }) => asset),
      datasets: [
        {
          data: dashboardAssetList.map(({ cost }) => cost.toNumber()),
          backgroundColor: generateColorList(dashboardAssetList.length, [
            "#F7464A",
            "#46BFBD",
            "#FDB45C",
          ]),
          hoverBackgroundColor: generateColorList(dashboardAssetList.length, [
            "#FF5A5E",
            "#5AD3D1",
            "#FFC870",
          ]),
        },
      ],
    };

    ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale);
  });
</script>

<div class="flex justify-between px-4" style="height: 85vh">
  <div class="w-4/12">
    <div class="ml-12">
      <h2>Payment Balance: {paymentBalance} {STABLECOIN_SYMBOL}</h2>
      <h2>Portfolio Net Worth: {portfolioNetWorth} {STABLECOIN_SYMBOL}</h2>
    </div>
    {#if typeof data !== "undefined"}
      <Doughnut class="mt-6" {data} {options} />
    {/if}
  </div>

  <div class="w-7/12 overflow-x-auto">
    {#if dashboardAssetList.length}
      <table class="table table-compact w-full ">
        <thead class="bg-black flex text-white w-full pr-4">
          <tr class="flex w-full mb-1">
            {#each Object.keys(dashboardAssetList[0]) as key}
              <th class="bg-black p-4 w-1/4 text-center">{key}</th>
            {/each}
          </tr>
        </thead>

        <tbody
          class="bg-grey-light flex flex-col items-center justify-start overflow-y-scroll w-full"
          style="max-height: 72vh; min-height: fit-content;"
        >
          {#each dashboardAssetList as dashboardAsset}
            <tr class="flex w-full mt-4 first:mt-0">
              {#each Object.values(dashboardAsset) as rowValue}
                <td class="p-2.5 w-1/4 text-center">{rowValue}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
