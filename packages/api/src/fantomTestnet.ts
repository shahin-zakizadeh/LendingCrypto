import {
  contract,
} from "@hovoh/evmcontractsregistry";
import { getExport } from "./exports";
import { MockPriceProvider__factory, MockToken__factory, SimpleInterestMarket__factory } from "./types/index";

export const FANTOM_TESTNET_NETWORK = 4002

export const ftmTestnetPeripherals = {
  mUSD: contract(getExport("mock_stable_coin", FANTOM_TESTNET_NETWORK)?.address, MockToken__factory.connect, MockToken__factory.multicall),
  WBTC: contract(getExport("mock_wbtc_coin", FANTOM_TESTNET_NETWORK)?.address, MockToken__factory.connect, MockToken__factory.multicall),
  priceProvider: contract(getExport("mock_price_provider", FANTOM_TESTNET_NETWORK)?.address, MockPriceProvider__factory.connect, MockPriceProvider__factory.multicall),
} as const;

const market = (address: string, deployedAt?: number) => contract(address, SimpleInterestMarket__factory.connect, SimpleInterestMarket__factory.multicall, deployedAt)

export const ftmTestnetMarkets = {
  wBTC: market(getExport("mock_wbtc_market", FANTOM_TESTNET_NETWORK)?.address, 0),
} as const;