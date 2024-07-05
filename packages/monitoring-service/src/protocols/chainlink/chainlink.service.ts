import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChainlinkApi, initChainlinkApi } from '@hovoh/chainlink-api';
import { EvmProviderService } from '../../evm/providers/evm-provider.service';
import {
  DEFAULT_PRIORITY,
  PriceMonitor,
} from '../../assets/price-monitor.service';
import {
  ChainlinkPriceSource,
  PRICE_SOURCE_TYPE_CHAINLINK_EVENT,
} from './chainlink-price-listener';

@Injectable()
export class ChainlinkService implements OnModuleInit {
  api: ChainlinkApi;

  constructor(
    private evmProviders: EvmProviderService,
    private priceMonitor: PriceMonitor,
  ) { }

  onModuleInit(): any {
    this.api = initChainlinkApi(this.evmProviders.getProviders());
    this.priceMonitor.addAdapter(
      PRICE_SOURCE_TYPE_CHAINLINK_EVENT,
      (ps) => new ChainlinkPriceSource(ps, this),
    );
  }
}
