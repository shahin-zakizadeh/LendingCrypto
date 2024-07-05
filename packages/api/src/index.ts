import {
  contract,
  NetworksContractsRegistry,
  ProvidersRegistry,
  ContractFactory, bindings,
} from "@hovoh/evmcontractsregistry";

export { getExport } from "./exports";
export * from "./marketTypes"
export * from "./types/index";
import { SimpleInterestMarket__factory } from "./types/factories/markets/SimpleInterestMarket__factory";
import { ERC20__factory } from "./types/openzeppelin/index";
import { HARDHAT_NETWORK, hardhatMarkets, hardhatPeripherals } from "./hardhat";
import { FANTOM_NETWORK, fantomMarkets, fantomPeripherals } from "./fantom";
import { FANTOM_TESTNET_NETWORK, ftmTestnetMarkets, ftmTestnetPeripherals } from "./fantomTestnet";

const namedFactories = {
  'market': bindings(SimpleInterestMarket__factory.connect, SimpleInterestMarket__factory.multicall),
  'ERC20': bindings(ERC20__factory.connect, ERC20__factory.multicall)
}

export interface ILendingClubPeripherals {
  [HARDHAT_NETWORK]: typeof hardhatPeripherals;
  [FANTOM_NETWORK]: typeof fantomPeripherals;
  [FANTOM_TESTNET_NETWORK]: typeof ftmTestnetPeripherals;
}

export const lendingClubPeripheral = new NetworksContractsRegistry<ILendingClubPeripherals, typeof namedFactories>()
lendingClubPeripheral.addNetwork(HARDHAT_NETWORK, hardhatPeripherals);
lendingClubPeripheral.addNetwork(FANTOM_NETWORK, fantomPeripherals);
lendingClubPeripheral.addNetwork(FANTOM_TESTNET_NETWORK, ftmTestnetPeripherals);
lendingClubPeripheral.setNamedFactories(namedFactories)

export type PeripheralsContract = keyof typeof hardhatPeripherals;
export const peripheralsContract = Object.keys(hardhatPeripherals);

export interface ILendingClubMarkets {
  [HARDHAT_NETWORK]: typeof hardhatMarkets;
  [FANTOM_NETWORK]: typeof fantomMarkets;
  [FANTOM_TESTNET_NETWORK]: typeof ftmTestnetMarkets;
}
export const lendingClubMarkets = new NetworksContractsRegistry<ILendingClubMarkets, {}>()
lendingClubMarkets.addNetwork(HARDHAT_NETWORK, hardhatMarkets);
lendingClubMarkets.addNetwork(FANTOM_NETWORK, fantomMarkets);
lendingClubMarkets.addNetwork(FANTOM_TESTNET_NETWORK, ftmTestnetMarkets);

export type LendingClubPeripherals = ContractFactory<ILendingClubPeripherals, typeof namedFactories>;
export type LendingClubMarkets = ContractFactory<ILendingClubMarkets, typeof namedFactories>;
export type LendingClubApi = {
  peripherals: LendingClubPeripherals
  markets: LendingClubMarkets
}

export const networkEnabled = [HARDHAT_NETWORK, FANTOM_NETWORK, FANTOM_TESTNET_NETWORK] as const;
export type EnabledNetwork = typeof networkEnabled[number];

export const lcNetwork = (chainId: number): EnabledNetwork => {
  // @ts-ignore
  if (networkEnabled.includes(chainId)) {
    return chainId as EnabledNetwork;
  }
  throw new Error(`Chain ID ${chainId} not supported by the LendingClubApi`);
}

export const initLendingClubApi = (providers: ProvidersRegistry): LendingClubApi => {
  return {
    peripherals: new ContractFactory(providers, lendingClubPeripheral),
    markets: new ContractFactory(providers, lendingClubMarkets),
  }
}
