import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Market } from '../../../lendingModule/entities/market.entity';
import { LendingClubService } from '../LendingClubApi.service';
import { MarketsService } from '../../../lendingModule/markets.service';
import { EvmTokensService } from '../../../evm/tokens/evm-tokens.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CronJob } from 'cron';

@Injectable()
export class LendingClubSyncService implements OnModuleInit {
  private readonly logger = new Logger(LendingClubSyncService.name);
  private syncAccountJob: CronJob
  private syncMarketsJob: CronJob
  constructor(
    private lcService: LendingClubService,
    private evmTokenService: EvmTokensService,
    private marketService: MarketsService,
  ) {
    this.syncAccountJob = new CronJob(CronExpression.EVERY_10_MINUTES, this.syncAccounts.bind(this))
    this.syncMarketsJob = new CronJob(CronExpression.EVERY_30_MINUTES, this.resyncMarkets.bind(this))
  }

  async onModuleInit() {
    if (process.env.NODE_ENV !== "test") {
      this.logger.log('Initial markets sync started');
      this.sync()
        .then(() => this.syncMarketsJob.start()).catch((error) => this.logger.error("Sync markets failed", error))
        .then(() => this.syncAccounts()
          .then(() => this.syncAccountJob.start())
          .then(() => this.logger.log('Initial markets sync completed'))
        );
    }

  }

  async sync() {
    const markets = await this.lcService.loadMarkets();
    await this.syncAssets(markets);
    await this.syncMarkets(markets);
  }

  async syncAssets(markets: Market[]) {
    for (const market of markets) {
      let collateral = await market.collateralAsset;
      collateral = await this.evmTokenService.registerAsset(
        collateral.chainId,
        collateral.address,
        collateral.type,
      );
      market.collateralAssetId = collateral.id;
      let principal = await market.principalAsset;
      principal = await this.evmTokenService.registerAsset(
        principal.chainId,
        principal.address,
        principal.type,
      );
      market.principalAssetId = principal.id;
    }
  }

  async syncMarkets(markets: Market[]) {
    for (const market of markets) {
      await this.marketService.registerMarket(market);
    }
  }

  async resyncMarkets() {
    this.logger.log("Starting market sync");
    const markets = await this.lcService.loadMarkets();
    await this.syncMarkets(markets);
  }

  async syncAccounts() {
    this.logger.log("Starting account sync");
    const markets = await this.marketService.getAllMarkets();
    for (const market of markets) {
      try {
        const { lastSync, nftIds } =
          await this.lcService.getOutdatedAccountNftIds(
            market.chainId,
            market.address,
            market.lastSync,
          );

        const accounts = await this.lcService.queryAccounts(
          market.chainId,
          market.address,
          [...nftIds],
        );
        for (const account of accounts) {
          account.marketId = market.id;
          await this.marketService.upsertAccount(account);
        }
        market.lastSync = lastSync;
        await this.marketService.updateMarket(market);
      } catch (error) {
        this.logger.error("An error happened when trying to sync accounts", error)
      }
    }
    this.logger.log("Completed account sync");
  }
}
