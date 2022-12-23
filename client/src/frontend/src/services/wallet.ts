import { init } from "../../../common/workers/testnet-frontend-workers";
import type { User } from "../../../common/codegen/Starbound.types";
import { getAddrByChainId } from "../../../common/signers";
import { get } from "svelte/store";
import { l } from "../../../common/utils";
import {
  cwHandlerStorage,
  initAll,
  LOCAL_STORAGE_KEY,
} from "../services/storage";

async function deposit(user: User) {
  const { cwDeposit } = await init();
  return await cwDeposit(user);
}

async function withdraw(amount: number) {
  const { cwWithdraw } = await init();
  return await cwWithdraw(amount);
}

// TODO: for debugging - remove it later
async function queryPoolsAndUsers() {
  const { cwQueryPoolsAndUsers } = await init();
  return await cwQueryPoolsAndUsers();
}

async function queryUser(address: string) {
  const { cwQueryUser } = await init();
  return await cwQueryUser(address);
}

// init wallet, add osmo chain, save address to localSorage
async function initCwHandler() {
  try {
    const address = await getAddrByChainId();
    cwHandlerStorage.set({ address });
    // TODO: encode address
    localStorage.setItem(LOCAL_STORAGE_KEY, address);
    await initAll();
  } catch (error) {
    l({ error });
  }

  l(get(cwHandlerStorage));
}

export { deposit, withdraw, queryPoolsAndUsers, queryUser, initCwHandler };
