import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import FastPriorityQueue from 'fastpriorityqueue';
import { MarketsService } from '../lendingModule/markets.service';
import { Liquidate } from './events/liquidate.event';
import { LiquidationResult } from './events/liquidation-result.event';
import { QueueLiquidation } from './events/queue-liquidation.event';
import { Logger } from '@nestjs/common';
import { Account } from '../lendingModule/entities/account.entity';
import { LendingClubService } from '../protocols/lending-club/LendingClubApi.service';

@Injectable()
export class LiquidationService {
  private liquidationQueue: FastPriorityQueue<QueueLiquidation>;
  private isLiquidating = false;
  protected readonly logger = new Logger(LiquidationService.name);
  constructor(
    private marketService: MarketsService,
    private eventEmitter: EventEmitter2,
    private lcService: LendingClubService,
  ) {
    this.liquidationQueue = new FastPriorityQueue(
      (a: QueueLiquidation, b: QueueLiquidation) => {
        return a.healthRatio < b.healthRatio;
      },
    );
  }

  @OnEvent(QueueLiquidation.NAME)
  async queueLiquidation(queueLiquidationEvent: QueueLiquidation) {
    this.liquidationQueue.add(queueLiquidationEvent);
    if (!this.isLiquidating) {
      await this.processLiquidationQueue();
    }
  }

  async processLiquidationQueue() {
    this.isLiquidating = true;
    const liquidate = this.liquidationQueue.peek();
    const market = await this.marketService.getMarketById(liquidate.marketId);
    const account = await this.marketService.getAccount(
      liquidate.marketId,
      liquidate.nftId,
    );
    const collateral = await market.collateralAsset;
    const principal = await market.principalAsset;
    this.eventEmitter.emit(
      Liquidate.NAME,
      new Liquidate(account, market, collateral, principal),
    );
  }

  @OnEvent(LiquidationResult.NAME)
  async completeLiquidation(liquidationResult: LiquidationResult) {
    this.logger.log(`liquidationResult:
    account: ${liquidationResult.account},
    success: ${liquidationResult.success},
    profit: ${liquidationResult.profit},
    txId: ${liquidationResult.txId}`);
    this.liquidationQueue.removeOne((q) => {
      return (
        q.nftId === liquidationResult.account.nftId &&
        q.marketId === liquidationResult.account.marketId
      );
    }); // use the accountID instead of the whole object
    await this.updateAccountInDB(liquidationResult.account);
    this.isLiquidating = false;
    if (!this.liquidationQueue.isEmpty()) {
      await this.processLiquidationQueue();
    }
  }

  async updateAccountInDB(account: Account) {
    const updatedAccount = await this.getAccountInfoFromBlockchain(account);
    return await this.marketService.upsertAccount(updatedAccount);
  }

  async getAccountInfoFromBlockchain(account: Account) {
    const market = await account.market;
    return (
      await this.lcService.queryAccounts(
        market.chainId,
        market.address,
        Array(account.nftId),
      )
    )[0];
  }
}
