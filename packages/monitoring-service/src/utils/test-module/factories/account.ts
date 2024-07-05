import { Market } from '../../../lendingModule/entities/market.entity';
import { Account } from '../../../lendingModule/entities/account.entity';
import Decimal from 'decimal.js';

interface AccountFactoryOptions {
    nftId?: number;
    collateralAmount?: Decimal;
    principalAmount?: Decimal;
    interestIndex?: Decimal;
}

let idCounter = 0;
let ownerAddress = 10000000;

export const accountFactory = (
  market: Market,
  options?: AccountFactoryOptions,
) => {
  idCounter += 1;
  ownerAddress += 1;
  const account = new Account();
  account.nftId = options?.nftId ?? idCounter;
  account.owner = `0x${ownerAddress.toString(16)}`;
  account.marketId = market.id;
  account.market = Promise.resolve(market);
  account.collateralAmount = options?.collateralAmount ?? new Decimal(0);
  account.principalAmount = options?.principalAmount ?? new Decimal(0);
  account.interestIndex = options?.interestIndex ?? market.interestIndex.mul(0.9);
  return account;
};
