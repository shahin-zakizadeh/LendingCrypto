import Decimal from 'decimal.js';
import { PriceSource } from '../entities/price-source.entity';

export class PriceUpdate {
  static NAME = 'price_update';

  constructor(
    public source: PriceSource,
    public timestamp: Date,
    public value: Decimal,
    public usdValue?: Decimal,
  ) { }
}
