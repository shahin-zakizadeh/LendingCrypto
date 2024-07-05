import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PriceUpdate } from './events/price-update.event';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Asset } from './entities/asset.entity';
import { PriceSource } from './entities/price-source.entity';
import { PriceEntry } from './entities/price-entry.entity';
import { id, Idish } from '../utils/idish';

@Injectable()
export class Prices {
  TABLE_NAME = 'price_entries';
  constructor(
    @InjectRepository(PriceEntry)
    private priceEntries: Repository<PriceEntry>,
    @InjectRepository(PriceSource)
    private priceSources: Repository<PriceSource>,
  ) {}

  @OnEvent(PriceUpdate.NAME)
  async addPrice(priceUpdate: PriceUpdate) {
    if (!priceUpdate.usdValue || priceUpdate.usdValue.lessThan(0)) {
      const denominatorPrice = await this.getPrice(
        priceUpdate.source.denominatorId,
      );
      priceUpdate.usdValue = priceUpdate.value.mul(denominatorPrice.usdValue);
    }
    const entry = this.eventToEntry(priceUpdate);
    await this.priceEntries.save(entry);
  }

  private eventToEntry(priceUpdate: PriceUpdate) {
    const pe = new PriceEntry();
    pe.at = priceUpdate.timestamp;
    pe.usdValue = priceUpdate.usdValue;
    pe.value = priceUpdate.value;
    pe.priceSourceId = priceUpdate.source.id;
    return pe;
  }

  async getPrice(
    asset: Idish<Asset>,
    priceSource?: Idish<PriceSource>,
  ): Promise<PriceEntry> {
    if (!priceSource) {
      priceSource = await this.priceSources.findOne({
        where: {
          assetId: id(asset),
        },
        order: {
          priority: 'DESC',
        },
      });
    }
    const price = await this.priceEntries.findOne({
      where: {
        priceSourceId: id(priceSource),
      },
      order: {
        at: 'DESC',
      },
    });
    if (!price) {
      throw new Error(
        `No price found for asset ${id(asset)} and price source ${id(
          priceSource,
        )}`,
      );
    }
    return price;
  }
}
