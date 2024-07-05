import { BigNumber } from 'ethers';
import { PriceSource } from '../../../../assets/entities/price-source.entity';
import { IPriceSourceAdapter } from '../../../../assets/price-source.factory';
import { PriceUpdate } from '../../../../assets/events/price-update.event';
import { UniswapV2Service } from '../uniswapv2.service';
import { UniswapV2Pair } from '@hovoh/uniswapv2-api';
import { Asset } from '../../../../assets/entities/asset.entity';
import Decimal from 'decimal.js';

export const PRICE_SOURCE_TYPE_UNILPV2_EVENT = 'univ2_swap_events';

const bnMax = (amount0: BigNumber, amount1: BigNumber) => {
  if (amount0.gt(amount1)) {
    return amount0;
  }
  return amount1;
};

export class UniLPV2PriceListener implements IPriceSourceAdapter {
  private pair: UniswapV2Pair;
  private denominator: Asset;
  private asset: Asset;

  constructor(
    private priceSource: PriceSource,
    private uniswapV2: UniswapV2Service,
  ) { }

  async start(eventHandler: (pu: PriceUpdate) => void) {
    this.pair = this.uniswapV2.uniV2LPPair(
      this.priceSource.chainId,
      this.priceSource.address,
    );
    const token1 = await this.pair.token1();
    this.asset = await this.priceSource.asset;
    this.denominator = await this.priceSource.denominator;
    const token1isDenominator = token1 === this.denominator.address;

    const swapFilter = this.pair.filters['Swap']();
    this.pair.on(swapFilter, async (...swap) => {
      const [_, amount0In, amount1In, amount0Out, amount1Out, __] = swap;
      const traded0 = bnMax(amount0In, amount0Out);
      const traded1 = bnMax(amount1In, amount1Out);
      const price = token1isDenominator
        ? this.price(traded0, traded1)
        : this.price(traded1, traded0);
      const priceUpdateEvent = new PriceUpdate(
        this.priceSource,
        new Date(),
        new Decimal(price.toString()).div(new Decimal(10).pow(token1isDenominator ? this.asset.decimals : this.denominator.decimals)),
      );
      eventHandler(priceUpdateEvent);
    });
  }

  price(numerator: BigNumber, denominator: BigNumber) {
    return denominator
      .mul(BigNumber.from('10').pow(this.asset.decimals))
      .div(numerator);
  }

  stop() {
    this.pair.removeAllListeners(this.pair.filters['Swap']());
  }
}
