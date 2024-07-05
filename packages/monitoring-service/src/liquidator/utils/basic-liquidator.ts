import { Injectable } from '@nestjs/common';
import { Account } from '../../lendingModule/entities/account.entity';
import { Market } from '../../lendingModule/entities/market.entity';
import { LendingClubService } from '../../protocols/lending-club/LendingClubApi.service';
import { bnToDecimal } from '../../utils/precision-math';
import Decimal from 'decimal.js';

@Injectable()
export class BasicLiquidator {
  priceDecimals = 8;
  constructor(private readonly lcService: LendingClubService) {}
  public async queryAccount(account: Account) {
    const market = await account.market;
    return (
      await this.lcService.queryAccounts(
        market.chainId,
        market.address,
        Array(account.nftId),
      )
    )[0];
  }

  private async getMarketData(account: Account) {
    const market = await account.market;
    const { collateralPrice, debtPrice } =
      await this.lcService.queryAssetsPrices(market.chainId, market.address);
    const principalValue = account.principalAmount.mul(
      bnToDecimal(debtPrice, this.priceDecimals),
    );
    const collateralValue = account.collateralAmount.mul(
      bnToDecimal(collateralPrice, this.priceDecimals),
    );

    return { market, principalValue, collateralValue };
  }

  public async amountToLiquidate(account: Account): Promise<Decimal> {
    const { market, principalValue, collateralValue } =
      await this.getMarketData(account);

    const healthRatio = await this.healthRatio(
      principalValue,
      collateralValue,
      market.liquidationThreshold,
    );

    const isHealthy = healthRatio.greaterThanOrEqualTo(1);
    if (isHealthy) {
      return new Decimal(0);
    }

    const isSmallAccount = account.principalAmount.lessThan(
      market.smallAccountThreshold,
    );
    if (isSmallAccount) {
      return account.principalAmount;
    }

    return this.calculateMaxAmountToLiquidate(
      account,
      market,
      principalValue,
      collateralValue,
    );
  }

  /**
   * The formula to calculate the amount to liquidate is
   * by getting the inverse of Health Ratio function
   * @returns the maximum amount to liquidate
   */
  private calculateMaxAmountToLiquidate(
    account: Account,
    market: Market,
    principalValue: Decimal,
    collateralValue: Decimal,
  ): Decimal {
    const LT = market.liquidationThreshold;
    const HR = market.liquidationMaxHR;
    const PP = principalValue.div(account.principalAmount);
    const PA = account.principalAmount;
    const CV = collateralValue;
    const LP = market.liquidationPenalty;
    const CF = market.closingFee;

    const maxAmountToLiquidate = (LT.mul(HR).mul(PP).mul(PA).sub(CV))
      .div(LT.mul(PP).mul(HR).sub(PP.mul(LP)).sub(PP.mul(CF)));
    const newPrincipalAmount = PA.sub(maxAmountToLiquidate);
    const isMediumAccount = account.principalAmount.lessThan(
      market.smallAccountThreshold.mul(2),
    );
    const getsBelowSmallAccountThreshold =
      market.smallAccountThreshold.greaterThan(newPrincipalAmount);
    if (isMediumAccount && getsBelowSmallAccountThreshold) {
      return account.principalAmount;
    }

    return maxAmountToLiquidate;
  }

  private async healthRatio(
    principalValue: Decimal,
    collateralValue: Decimal,
    liquidationThreshold: Decimal,
  ) {
    return collateralValue.div(principalValue.mul(liquidationThreshold));
  }
}
