import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { PriceSource } from './entities/price-source.entity';
import {
  AdapterFactory,
  IPriceSourceAdapter,
  PriceSourceFactory,
} from './price-source.factory';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PriceUpdate } from './events/price-update.event';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export const DEFAULT_PRIORITY = 100;

@Injectable()
export class PriceMonitor implements OnApplicationBootstrap {
  private readonly currentlyMonitored: { [id: number]: IPriceSourceAdapter };
  private sourceFactory: PriceSourceFactory;
  private lastUpdateCache: { [id: number]: PriceUpdate };

  constructor(
    private eventEmitter: EventEmitter2,
    @InjectRepository(PriceSource)
    private priceSources: Repository<PriceSource>,
  ) {
    this.currentlyMonitored = {};
    this.sourceFactory = new PriceSourceFactory();
    this.lastUpdateCache = {};
  }

  addAdapter(identifier: string, factory: AdapterFactory) {
    this.sourceFactory.addAdapter(identifier, factory);
  }

  async monitor(priceSource: PriceSource) {
    if (this.isAlreadyMonitored(priceSource)) {
      return;
    }
    await this.startPriceSource(priceSource);
  }

  private async startPriceSource(priceSource: PriceSource) {
    const source = this.sourceFactory.buildFor(priceSource);
    await source.start((priceUpdate) => {
      const lastUpdate = this.lastUpdateCache[priceUpdate.source.id];
      if (
        !lastUpdate ||
        (!priceUpdate.value.eq(lastUpdate.value) &&
          priceUpdate.usdValue !== lastUpdate.usdValue)
      ) {
        this.eventEmitter.emit(PriceUpdate.NAME, priceUpdate);
        this.lastUpdateCache[priceUpdate.source.id] = priceUpdate;
      }
    });
    this.currentlyMonitored[priceSource.id] = source;
  }

  isAlreadyMonitored(priceSource: PriceSource) {
    return Boolean(this.currentlyMonitored[priceSource.id]);
  }

  async onApplicationBootstrap(): Promise<any> {
    const enabledPriceSources = await this.priceSources.find({
      where: { enabled: true },
    });
    for (const ps of enabledPriceSources) {
      await this.monitor(ps);
    }
  }

  async registerPriceSource(priceSource: PriceSource): Promise<PriceSource> {
    try {
      return await this.priceSources.save(priceSource);
    } catch (error) {
      if (!error.message.includes('duplicate')) {
        throw error;
      }
    }
    return await this.priceSources.findOne({
      where: {
        address: priceSource.address,
        chainId: priceSource.chainId,
        type: priceSource.type,
        assetId: priceSource.assetId,
      }
    });
  }

  async getPriceSources(priceSource: Partial<PriceSource>) {
    return await this.priceSources.find({
      where: {
        address: priceSource.address,
        chainId: priceSource.chainId,
        type: priceSource.type,
        assetId: priceSource.assetId,
      },
      order: {
        priority: 'DESC',
      },
    });
  }
}
