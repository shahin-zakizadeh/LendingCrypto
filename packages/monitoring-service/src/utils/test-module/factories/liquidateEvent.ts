import { Asset } from '../../../assets/entities/asset.entity';
import { Account } from '../../../lendingModule/entities/account.entity';
import { Market } from '../../../lendingModule/entities/market.entity';
import { Liquidate } from '../../../liquidation/events/liquidate.event';

export const liquidateEventFactory = (
  account: Account,
  market: Market,
  collateral: Asset,
  principal: Asset,
) => {
  return new Liquidate(account, market, collateral, principal);
};
