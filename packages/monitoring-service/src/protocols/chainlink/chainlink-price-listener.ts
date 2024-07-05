import { BigNumber } from 'ethers';
import { PriceSource } from '../../assets/entities/price-source.entity';
import { IPriceSourceAdapter } from '../../assets/price-source.factory';
import { PriceUpdate } from '../../assets/events/price-update.event';
import { AggregatorV3Interface } from '@hovoh/chainlink-api';
import { ChainlinkService } from './chainlink.service';
import Decimal from 'decimal.js';

export const PRICE_SOURCE_TYPE_CHAINLINK_EVENT = 'price_source_cl_event';

export class ChainlinkPriceSource implements IPriceSourceAdapter {
  private feed: AggregatorV3Interface;

  constructor(
    private priceSource: PriceSource,
    private chainlink: ChainlinkService,
  ) { }

  async start(eventHandler: (pu: PriceUpdate) => void) {
    const proxy = this.chainlink.api
      .forNetwork(this.priceSource.chainId)
      .getContractInstance('AggregatorProxy', this.priceSource.address);
    this.feed = this.chainlink.api
      .forNetwork(this.priceSource.chainId)
      .getContractInstance('AggregatorV3', await proxy.aggregator());
    const priceUpdateFilter =
      this.feed.filters['AnswerUpdated(int256,uint256,uint256)']();
    const listener = async (priceUpdate: BigNumber) => {
      const priceUpdateEvent = new PriceUpdate(
        this.priceSource,
        new Date(),
        new Decimal(priceUpdate.toNumber()).div(10**8),
        new Decimal(priceUpdate.toNumber()).div(10**8),
      );
      eventHandler(priceUpdateEvent);
    };
    this.feed.on(priceUpdateFilter, listener);
  }

  stop() {
    this.feed.removeAllListeners(
      this.feed.filters['AnswerUpdated(int256,uint256,uint256)'](),
    );
  }
}
