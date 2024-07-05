import {
    contract
} from "@hovoh/evmcontractsregistry";
import { getExport } from "./exports";
import { ChainlinkPriceOracle__factory, PriceProvider__factory, SimpleInterestMarket__factory } from "./types/index";

export const FANTOM_NETWORK = 250

export const fantomPeripherals = {
    priceProvider: contract(getExport("price_provider", FANTOM_NETWORK).address, PriceProvider__factory.connect, PriceProvider__factory.multicall),
    chainlinkAdapter: contract(getExport("chainlink_price_oracle", FANTOM_NETWORK).address, ChainlinkPriceOracle__factory.connect, ChainlinkPriceOracle__factory.multicall)
} as const;

const market = (address: string, deployedAt?: number) => contract(address, SimpleInterestMarket__factory.connect, SimpleInterestMarket__factory.multicall, deployedAt)

export const fantomMarkets = {
    FTMUSDC: market(getExport("ftm_usdc_market", FANTOM_NETWORK).address, 59849094),
} as const;