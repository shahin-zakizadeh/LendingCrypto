import { Asset } from 'src/assets/entities/asset.entity';
import { Account } from 'src/lendingModule/entities/account.entity';
import { Market } from 'src/lendingModule/entities/market.entity';

export class Liquidate {
  static NAME = 'liquidate';
  constructor(
    public account: Account,
    public market: Market,
    public collateral: Asset,
    public principal: Asset,
  ) {}
}
