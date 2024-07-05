import { BigNumber } from 'ethers';
import { accountFactory } from '../../utils/test-module/factories/account';
import { assetFactory } from '../../utils/test-module/factories/assets';
import { marketFactory } from '../../utils/test-module/factories/market';
import { BasicLiquidator } from './basic-liquidator';
import Decimal from 'decimal.js';
import { bnToDecimal } from '../../utils/precision-math';

describe('BasicLiquidator', () => {
  let basicLiquidator: BasicLiquidator;
  let queryAccounts = jest.fn();
  let queryAssetsPrices = jest.fn();
  beforeEach(async () => {
    const lcService = { queryAccounts, queryAssetsPrices };

    // @ts-ignore
    basicLiquidator = new BasicLiquidator(lcService);
  });

  it('should be defined', () => {
    expect(basicLiquidator).toBeDefined();
  });

  it('should query an account from blockchain', async () => {
    let asset0 = assetFactory();
    let asset1 = assetFactory({ chaindId: asset0.chainId });
    let market = marketFactory(asset0, asset1, {
      liquidationThreshold: new Decimal(1.1),
      liquidationMaxHR: new Decimal(1.5),
    });
    let account = accountFactory(market);
    queryAccounts.mockReturnValue([account]);
    queryAssetsPrices.mockReturnValue({
      collateralPrice: BigNumber.from(30000000),
      debtPrice: BigNumber.from(20000000),
    });
    const queriedAccount = await basicLiquidator.queryAccount(account);
    expect(queriedAccount).toBeDefined();
    expect(queriedAccount.nftId).toEqual(account.nftId);
    expect(queriedAccount.marketId).toEqual(account.marketId);
  });

  it('should not liquidate a healthy vault', async () => {
    let asset0 = assetFactory();
    let asset1 = assetFactory({ chaindId: asset0.chainId });
    let market = marketFactory(asset0, asset1, {
      liquidationThreshold: new Decimal(1.5),
    });
    const collateralAmount = new Decimal(1000);
    const principalAmount = new Decimal(100);
    let account = accountFactory(market, { collateralAmount, principalAmount });
    queryAccounts.mockReturnValue([account]);
    queryAssetsPrices.mockReturnValue({
      collateralPrice: BigNumber.from(30000000),
      debtPrice: BigNumber.from(20000000),
    });
    const amountToLiquidate = await basicLiquidator.amountToLiquidate(account);
    expect(amountToLiquidate.toNumber()).toBe(0);
  });

  it('should calculate amount to liquidate for a small vault', async () => {
    let asset0 = assetFactory();
    let asset1 = assetFactory({ chaindId: asset0.chainId });
    let market = marketFactory(asset0, asset1, {
      liquidationThreshold: new Decimal(1.5),
      liquidationMaxHR: new Decimal(2),
      liquidationPenalty: new Decimal(1.1),
    });
    const collateralAmount = new Decimal(100);
    const principalAmount = new Decimal(90);
    let account = accountFactory(market, { collateralAmount, principalAmount });
    queryAccounts.mockReturnValue([account]);
    queryAssetsPrices.mockReturnValue({
      collateralPrice: BigNumber.from(10000000),
      debtPrice: BigNumber.from(10000000),
    });
    const amountToLiquidate = await basicLiquidator.amountToLiquidate(account);
    expect(amountToLiquidate).toBe(principalAmount);
  });

  it('should calculate amount to liquidate for a medium vault becoming small', async () => {
    let asset0 = assetFactory();
    let asset1 = assetFactory({ chaindId: asset0.chainId });
    let market = marketFactory(asset0, asset1, {
      liquidationThreshold: new Decimal(1.5),
      liquidationMaxHR: new Decimal(2),
      liquidationPenalty: new Decimal(1.1),
    });
    const collateralAmount = new Decimal(150);
    const principalAmount = new Decimal(110);
    let account = accountFactory(market, { collateralAmount, principalAmount });
    queryAccounts.mockReturnValue([account]);
    queryAssetsPrices.mockReturnValue({
      collateralPrice: BigNumber.from(22000000),
      debtPrice: BigNumber.from(21000000),
    });
    const amountToLiquidate = await basicLiquidator.amountToLiquidate(account);
    expect(amountToLiquidate).toBe(principalAmount);
  });

  it('should calculate amount to liquidate for a big vault, debtPrice less than collateralPrice', async () => {
    const liquidationThreshold = new Decimal(1.5);
    const liquidationMaxHR = new Decimal(2);
    const liquidationPenalty = new Decimal(1.1);
    let asset0 = assetFactory();
    let asset1 = assetFactory({ chaindId: asset0.chainId });
    let market = marketFactory(asset0, asset1, {
      liquidationThreshold,
      liquidationMaxHR,
      liquidationPenalty,
    });

    const collateralAmount = new Decimal(1500);
    const principalAmount = new Decimal(1100);
    let account = accountFactory(market, { collateralAmount, principalAmount });

    let collateralPriceBigNumber = BigNumber.from(30000000);
    let debtPriceBigNumber = BigNumber.from(28000000);
    queryAccounts.mockReturnValue([account]);
    queryAssetsPrices.mockReturnValue({
      collateralPrice: collateralPriceBigNumber,
      debtPrice: debtPriceBigNumber,
    });
    const amountToLiquidate = await basicLiquidator.amountToLiquidate(account);
    const collateralPrice = bnToDecimal(collateralPriceBigNumber, 8);
    const debtPrice = bnToDecimal(debtPriceBigNumber, 8);

    const newCollateralAmount =
      collateralAmount.toNumber() -
      (amountToLiquidate.toNumber() * debtPrice.toNumber()) /
        collateralPrice.toNumber() -
      (amountToLiquidate.toNumber() *
        debtPrice.toNumber() *
        market.closingFee.toNumber()) /
        collateralPrice.toNumber() -
      (amountToLiquidate.toNumber() *
        debtPrice.toNumber() *
        (liquidationPenalty.toNumber() - 1)) /
        collateralPrice.toNumber();
    const newPrincipalAmount =
      principalAmount.toNumber() - amountToLiquidate.toNumber();
    const newHealthRatio =
      (newCollateralAmount * collateralPrice.toNumber()) /
      (debtPrice.toNumber() *
        newPrincipalAmount *
        liquidationThreshold.toNumber());

    expect(amountToLiquidate.toNumber()).toBeLessThan(
      principalAmount.toNumber(),
    );
    expect(amountToLiquidate.toNumber()).toBeGreaterThan(1);
    expect(newHealthRatio).toBeCloseTo(market.liquidationMaxHR.toNumber(), 2);
  });

  it('should calculate amount to liquidate for a big vault, debtPrice equal collateralPrice', async () => {
    const liquidationThreshold = new Decimal(1.5);
    const liquidationMaxHR = new Decimal(2);
    const liquidationPenalty = new Decimal(1.1);
    let asset0 = assetFactory();
    let asset1 = assetFactory({ chaindId: asset0.chainId });
    let market = marketFactory(asset0, asset1, {
      liquidationThreshold,
      liquidationMaxHR,
      liquidationPenalty,
    });

    const collateralAmount = new Decimal(1500);
    const principalAmount = new Decimal(1100);
    let account = accountFactory(market, { collateralAmount, principalAmount });

    const collateralPriceBigNumber = BigNumber.from(10000000);
    const debtPriceBigNumber = BigNumber.from(10000000);
    queryAccounts.mockReturnValue([account]);
    queryAssetsPrices.mockReturnValue({
      collateralPrice: collateralPriceBigNumber,
      debtPrice: debtPriceBigNumber,
    });
    const amountToLiquidate = await basicLiquidator.amountToLiquidate(account);
    const collateralPrice = bnToDecimal(collateralPriceBigNumber, 8);
    const debtPrice = bnToDecimal(debtPriceBigNumber, 8);

    const newCollateralAmount =
      collateralAmount.toNumber() -
      (amountToLiquidate.toNumber() * debtPrice.toNumber()) /
        collateralPrice.toNumber() -
      (amountToLiquidate.toNumber() *
        debtPrice.toNumber() *
        market.closingFee.toNumber()) /
        collateralPrice.toNumber() -
      (amountToLiquidate.toNumber() *
        debtPrice.toNumber() *
        (liquidationPenalty.toNumber() - 1)) /
        collateralPrice.toNumber();
    const newPrincipalAmount =
      principalAmount.toNumber() - amountToLiquidate.toNumber();
    const newHealthRatio =
      (newCollateralAmount * collateralPrice.toNumber()) /
      (debtPrice.toNumber() *
        newPrincipalAmount *
        liquidationThreshold.toNumber());

    expect(amountToLiquidate.toNumber()).toBeLessThan(
      principalAmount.toNumber(),
    );
    expect(amountToLiquidate.toNumber()).toBeGreaterThan(1);
    expect(newHealthRatio).toBeCloseTo(market.liquidationMaxHR.toNumber(), 2);
  });

  it('should calculate amount to liquidate for a big vault, debtPrice greater than collateralPrice', async () => {
    const liquidationThreshold = new Decimal(1.5);
    const liquidationMaxHR = new Decimal(2);
    const liquidationPenalty = new Decimal(1.1);
    let asset0 = assetFactory();
    let asset1 = assetFactory({ chaindId: asset0.chainId });
    let market = marketFactory(asset0, asset1, {
      liquidationThreshold,
      liquidationMaxHR,
      liquidationPenalty,
    });

    const collateralAmount = new Decimal(1500);
    const principalAmount = new Decimal(1100);
    let account = accountFactory(market, { collateralAmount, principalAmount });

    const collateralPriceBigNumber = BigNumber.from(10000000);
    const debtPriceBigNumber = BigNumber.from(10000000);
    queryAccounts.mockReturnValue([account]);
    queryAssetsPrices.mockReturnValue({
      collateralPrice: collateralPriceBigNumber,
      debtPrice: debtPriceBigNumber,
    });
    const amountToLiquidate = await basicLiquidator.amountToLiquidate(account);
    const collateralPrice = bnToDecimal(collateralPriceBigNumber, 8);
    const debtPrice = bnToDecimal(debtPriceBigNumber, 8);

    const newCollateralAmount =
      collateralAmount.toNumber() -
      (amountToLiquidate.toNumber() * debtPrice.toNumber()) /
        collateralPrice.toNumber() -
      (amountToLiquidate.toNumber() *
        debtPrice.toNumber() *
        market.closingFee.toNumber()) /
        collateralPrice.toNumber() -
      (amountToLiquidate.toNumber() *
        debtPrice.toNumber() *
        (liquidationPenalty.toNumber() - 1)) /
        collateralPrice.toNumber();
    const newPrincipalAmount =
      principalAmount.toNumber() - amountToLiquidate.toNumber();
    const newHealthRatio =
      (newCollateralAmount * collateralPrice.toNumber()) /
      (debtPrice.toNumber() *
        newPrincipalAmount *
        liquidationThreshold.toNumber());

    expect(amountToLiquidate.toNumber()).toBeLessThan(
      principalAmount.toNumber(),
    );
    expect(amountToLiquidate.toNumber()).toBeGreaterThan(1);
    expect(newHealthRatio).toBeCloseTo(market.liquidationMaxHR.toNumber(), 2);
  });
});
