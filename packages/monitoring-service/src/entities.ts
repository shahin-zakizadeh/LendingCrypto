import { VolumeEntry } from './MetricTracking/VolumeEntry.entity';
import { MarketCapEntry } from './MetricTracking/MarketCapEntry.entity';
import { SlippageEntry } from './MetricTracking/slippage/SlippageEntry.entity';
import { Market } from './lendingModule/entities/market.entity';
import { Account } from './lendingModule/entities/account.entity';
import { Asset } from './assets/entities/asset.entity';
import { PriceSource } from './assets/entities/price-source.entity';
import { PriceEntry } from './assets/entities/price-entry.entity';

export const entities = [
  Market,
  Account,
  Asset,
  PriceSource,
  PriceEntry,
  SlippageEntry,
  MarketCapEntry,
  VolumeEntry,
];
