import { Injectable } from '@nestjs/common';
import { Market } from './entities/market.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import { id, Idish } from '../utils/idish';

@Injectable()
export class MarketsService {
  constructor(
    @InjectRepository(Market)
    private markets: Repository<Market>,
    @InjectRepository(Account)
    private accounts: Repository<Account>,
  ) { }

  async getMarket(address: string, chainId: number) {
    return await this.markets.findOneBy({ address, chainId });
  }

  async getMarketById(id: number) {
    return await this.markets.findOneBy({ id });
  }

  async getAllMarkets() {
    return await this.markets.find();
  }

  async updateMarket(market: Market): Promise<Market> {
    return this.markets.save(market);
  }

  async registerMarket(market: Market): Promise<Market> {
    try {
      return await this.markets.save(market);
    } catch (error) {
      const {lastSync, ...other} = market
      await this.markets.update({ address: market.address, chainId: market.chainId }, other);
    }
    return this.getMarket(market.address, market.chainId);
  }

  async registerAccount(account: Account): Promise<Account> {
    try {
      return await this.accounts.save(account);
    } catch (error) {
      if (!error.message.includes('duplicate')) {
        throw error;
      }
    }
    return this.getAccount(account.marketId, account.nftId);
  }

  async getAccount(market: Idish<Market>, nftId: number): Promise<Account> {
    return this.accounts.findOneBy({
      marketId: id(market),
      nftId: nftId,
    });
  }

  async getAllAccounts() {
    return await this.accounts.find();
  }

  async upsertAccount(account: Account): Promise<Account> {
    const exAccount = await this.getAccount(account.marketId, account.nftId);
    if (exAccount == null) return await this.registerAccount(account);
    exAccount.collateralAmount = account.collateralAmount;
    exAccount.principalAmount = account.principalAmount;
    exAccount.interestIndex = account.interestIndex;
    return await this.accounts.save(exAccount);
  }
}
