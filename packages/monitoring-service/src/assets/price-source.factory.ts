import { PriceUpdate } from './events/price-update.event';
import { PriceSource } from './entities/price-source.entity';

export interface IPriceSourceAdapter {
  start(eventHandler: (pu: PriceUpdate) => void): Promise<void>;
  stop(): void;
}

export interface PriceSourceAdapterMap {
  [type: string]: (ps: PriceSource) => IPriceSourceAdapter;
}

export type AdapterFactory = (ps: PriceSource) => IPriceSourceAdapter;

export class PriceSourceFactory {
  private readonly adapterMap: PriceSourceAdapterMap;

  constructor() {
    this.adapterMap = {};
  }

  buildFor(priceSource: PriceSource) {
    return this.adapterMap[priceSource.type](priceSource);
  }

  addAdapter(type: string, factory: AdapterFactory) {
    this.adapterMap[type] = factory;
  }
}
