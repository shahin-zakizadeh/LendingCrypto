import { PriceSource } from './entities/price-source.entity';
import { PriceUpdate } from './events/price-update.event';
import { PriceMonitor } from './price-monitor.service';
import { OnModuleInit } from '@nestjs/common';
import { IPriceSourceAdapter } from './price-source.factory';

interface Feed {
  priceSource: PriceSource;
  eventHandler: (pu: PriceUpdate) => void;
}

export abstract class PricePollingService implements OnModuleInit {
  protected feedsPerNetwork: { [chainId: number]: Feed[] };

  protected constructor(
    protected sourceType: string,
    protected priceMonitor: PriceMonitor,
  ) {
    this.feedsPerNetwork = [];
  }

  onModuleInit(): any {
    this.priceMonitor.addAdapter(this.sourceType, (ps) => this.prepare(ps));
  }

  prepare(priceSource: PriceSource): IPriceSourceAdapter {
    if (priceSource.type !== this.sourceType) {
      throw new Error(
        `${priceSource.type} cannot be added to ${this.sourceType} polling service`,
      );
    }
    if (!this.feedsPerNetwork[priceSource.chainId]) {
      this.feedsPerNetwork[priceSource.chainId] = [];
    }
    return {
      start: (eventHandler: (pu: PriceUpdate) => void) =>
        this.start(priceSource, eventHandler),
      stop: () => this.stop(priceSource),
    };
  }

  async start(
    priceSource: PriceSource,
    eventHandler: (pu: PriceUpdate) => void,
  ) {
    this.feedsPerNetwork[priceSource.chainId].push({
      priceSource,
      eventHandler,
    });
  }

  async stop(priceSource: PriceSource) {
    this.feedsPerNetwork[priceSource.chainId] = this.feedsPerNetwork[
      priceSource.chainId
    ].filter((feed) => feed.priceSource.id !== priceSource.id);
  }
}
