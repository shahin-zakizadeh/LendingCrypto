import { SimpleInterestMarket } from "./types/index";
import { SimpleInterestMarketMulticall } from "./types/markets/SimpleInterestMarket";

export type Market = SimpleInterestMarket & { multiCall: SimpleInterestMarketMulticall }