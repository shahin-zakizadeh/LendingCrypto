import Decimal from "decimal.js";
import { Asset } from "src/assets/entities/asset.entity";
import { Market } from "../../../lendingModule/entities/market.entity";

interface MarketFactoryOptions {
    interestIndex?: Decimal;
    liquidationThreshold?: Decimal;
}

let contractAddress = 100000;

interface MarketFactoryOptions {
    liquidationThreshold?: Decimal;
    interestIndex?: Decimal;
    liquidationMaxHR?: Decimal;
    liquidationPenalty?: Decimal;
    smallAccountThreshold?: Decimal;
    closingFee?: Decimal;
}

export const marketFactory = (collateral: Asset, principal: Asset, options?: MarketFactoryOptions) => {
    contractAddress += 1;
    const newMarket = new Market();
    newMarket.address = `0x${contractAddress.toString(16)}`;
    newMarket.chainId = collateral.chainId;
    newMarket.collateralAssetId = collateral.id;
    newMarket.principalAssetId = principal.id;
    newMarket.smallAccountThreshold = options?.smallAccountThreshold ?? new Decimal(100);
    newMarket.interestIndex = options?.interestIndex ?? new Decimal(Math.random()).add(1)
    newMarket.liquidationThreshold = options?.liquidationThreshold ?? new Decimal(Math.random()).add(1)
    newMarket.liquidationMaxHR = options?.liquidationMaxHR ?? new Decimal(1.5)
    newMarket.liquidationPenalty = options?.liquidationPenalty ?? new Decimal(1.1)
    newMarket.closingFee = options?.closingFee ?? new Decimal(0.01)
    return newMarket;
}