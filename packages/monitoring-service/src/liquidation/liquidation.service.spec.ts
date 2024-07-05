import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { MarketsService } from '../lendingModule/markets.service';
import { QueueLiquidation } from './events/queue-liquidation.event';
import { TestAppModule } from '../utils/test-module/test-app.module';
import { TestAppService } from '../utils/test-module/test-app.service';
import { LiquidationService } from './liquidation.service';
import { Liquidate } from './events/liquidate.event';
import { Account } from '../lendingModule/entities/account.entity';
import { Market } from '../lendingModule/entities/market.entity';
import { LiquidationResult } from './events/liquidation-result.event';
import { TypeOrmModule } from '@nestjs/typeorm';
import { assetFactory } from '../utils/test-module/factories/assets';
import { marketFactory } from '../utils/test-module/factories/market';
import { accountFactory } from '../utils/test-module/factories/account';
import { AssetService } from '../assets/asset.service';
import { MarketsModule } from '../lendingModule/markets.module';
import { AssetsModule } from '../assets/assets.module';
import { Asset } from '../assets/entities/asset.entity';
import { LendingClubService } from '../protocols/lending-club/LendingClubApi.service';
import Decimal from 'decimal.js';

describe('LiquidationService', () => {
  let service: LiquidationService;
  let testService: TestAppService;
  let marketsService: MarketsService;
  let assetsService: AssetService;
  let eventEmitter: EventEmitter2;
  let queryAccountsMock = jest.fn();
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TestAppModule.register({ useDatabase: true }),
        TypeOrmModule.forFeature([Account, Market, Asset]),
        MarketsModule,
        AssetsModule,
      ],
      providers: [
        LiquidationService,
        MarketsService,
        AssetService,
        EventEmitter2,
      ],
    })
      .useMocker((token) => {
        if (token == LendingClubService) {
          return {
            queryAccounts: queryAccountsMock,
          };
        }
      })
      .compile();

    service = module.get<LiquidationService>(LiquidationService);
    testService = module.get<TestAppService>(TestAppService);
    marketsService = module.get<MarketsService>(MarketsService);
    assetsService = module.get<AssetService>(AssetService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    await testService.prepareTest();
  });

  afterEach(async () => {
    await testService?.cleanDatabase();
    await testService?.closeDatabaseConnection();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add one liquidation to the queue, and processLiquidationQueue should be called automatically', async () => {
    // @ts-ignore
    const processLiquidationSpy = jest.spyOn(
      service,
      'processLiquidationQueue',
    );
    // creating assets
    let asset0 = assetFactory();
    let asset1 = assetFactory({ chaindId: asset0.chainId });
    asset0 = await assetsService.registerAsset(asset0);
    asset1 = await assetsService.registerAsset(asset1);
    // creating market
    let market = marketFactory(asset0, asset1);
    market = await marketsService.registerMarket(market);
    // creating account
    let account = accountFactory(market);
    account = await marketsService.registerAccount(account);
    // creating a new QueueLiquidation event
    const newQueueLiquidation = new QueueLiquidation(
      account.nftId,
      market.id,
      1,
    );

    await service.queueLiquidation(newQueueLiquidation);
    expect(processLiquidationSpy).toHaveBeenCalled();
  });

  it('should not call processLiquidationQueue if isLiquidating is true', async () => {
    // @ts-ignore
    const processLiquidationSpy = jest.spyOn(
      service,
      'processLiquidationQueue',
    );
    // creating assets
    let asset0 = assetFactory();
    let asset1 = assetFactory({ chaindId: asset0.chainId });
    asset0 = await assetsService.registerAsset(asset0);
    asset1 = await assetsService.registerAsset(asset1);
    // creating market
    let market = marketFactory(asset0, asset1);
    market = await marketsService.registerMarket(market);
    // creating account
    let account = accountFactory(market);
    account = await marketsService.registerAccount(account);
    // creating a new QueueLiquidation event
    const newQueueLiquidation = new QueueLiquidation(
      account.nftId,
      market.id,
      1,
    );

    // @ts-ignore
    service.isLiquidating = true; // set isLiquidating to true to test the queue
    await service.queueLiquidation(newQueueLiquidation);
    expect(processLiquidationSpy).not.toHaveBeenCalled();
  });

  it('should test the Liquidate event gets called', async () => {
    // @ts-ignore
    const emitSpy = jest.spyOn(service.eventEmitter, 'emit');
    // creating assets
    let asset0 = assetFactory();
    let asset1 = assetFactory({ chaindId: asset0.chainId });
    asset0 = await assetsService.registerAsset(asset0);
    asset1 = await assetsService.registerAsset(asset1);
    // creating market
    let market = marketFactory(asset0, asset1);
    market = await marketsService.registerMarket(market);
    // creating account
    let account = accountFactory(market);
    account = await marketsService.registerAccount(account);
    // creating a new QueueLiquidation event
    const newQueueLiquidation = new QueueLiquidation(
      account.nftId,
      market.id,
      1,
    );

    // @ts-ignore
    service.isLiquidating = true;
    await service.queueLiquidation(newQueueLiquidation);
    await service.processLiquidationQueue();
    expect(emitSpy).toHaveBeenCalledWith(Liquidate.NAME, expect.any(Liquidate));
  });

  it('should complete the liquidation process and make sure the correct account is deleted', async () => {
    // @ts-ignore
    const logSpy = jest.spyOn(service.logger, 'log');
    let asset0 = assetFactory();
    let asset1 = assetFactory({ chaindId: asset0.chainId });
    asset0 = await assetsService.registerAsset(asset0);
    asset1 = await assetsService.registerAsset(asset1);

    // creating market
    let market = marketFactory(asset0, asset1);
    market = await marketsService.registerMarket(market);

    // creating account
    let account1 = accountFactory(market);
    account1 = await marketsService.registerAccount(account1);
    let account2 = accountFactory(market);
    account2 = await marketsService.registerAccount(account2);

    const queueLiquidation1 = new QueueLiquidation(
      account1.nftId,
      market.id,
      1,
    );
    const queueLiquidation2 = new QueueLiquidation(
      account2.nftId,
      market.id,
      0,
    );
    queryAccountsMock.mockReturnValue([account1]);
    // @ts-ignore
    service.isLiquidating = true; // set isLiquidating to true to test the queue
    await service.queueLiquidation(queueLiquidation1);
    // @ts-ignore
    expect(service.liquidationQueue.peek()).toEqual(queueLiquidation1);

    await service.queueLiquidation(queueLiquidation2);
    // @ts-ignore
    expect(service.liquidationQueue.peek()).toEqual(queueLiquidation2);

    const liquidationResult1 = new LiquidationResult(
      account1,
      true,
      1,
      '0x123',
    );
    await service.completeLiquidation(liquidationResult1);
    expect(logSpy).toHaveBeenCalledWith(`liquidationResult:
    account: ${liquidationResult1.account},
    success: ${liquidationResult1.success},
    profit: ${liquidationResult1.profit},
    txId: ${liquidationResult1.txId}`);
    // @ts-ignore
    expect(service.liquidationQueue.size).toEqual(1);
    // @ts-ignore
    expect(service.liquidationQueue.peek()).toEqual(queueLiquidation2);
  });

  it('should test the whole process in one run', async () => {
    // @ts-ignore
    const emitSpy = jest.spyOn(service.eventEmitter, 'emit');
    // @ts-ignore
    const logSpy = jest.spyOn(service.logger, 'log');
    // creating assets
    let asset0 = assetFactory();
    let asset1 = assetFactory({ chaindId: asset0.chainId });
    asset0 = await assetsService.registerAsset(asset0);
    asset1 = await assetsService.registerAsset(asset1);

    // creating market
    let market = marketFactory(asset0, asset1);
    market = await marketsService.registerMarket(market);

    // creating account
    let account = accountFactory(market);
    account = await marketsService.registerAccount(account);

    queryAccountsMock.mockReturnValue([account]);

    // creating a new QueueLiquidation event
    const newQueueLiquidation = new QueueLiquidation(
      account.nftId,
      market.id,
      1,
    );

    // @ts-ignore
    service.isLiquidating = true; // set isLiquidating to true to test the queue
    await service.queueLiquidation(newQueueLiquidation);
    // @ts-ignore
    const queueHead = service.liquidationQueue.peek(); // checking if the new QueueLiquidation event is added to the queue
    expect(queueHead).toEqual(newQueueLiquidation);

    await service.processLiquidationQueue();
    // receive Liquidate event
    expect(emitSpy).toHaveBeenCalledWith(Liquidate.NAME, expect.any(Liquidate));

    const result = new LiquidationResult(account, true, 1, '0x123');
    await service.completeLiquidation(result);
    // @ts-ignore
    expect(service.liquidationQueue.isEmpty()).toBe(true);
    expect(logSpy).toHaveBeenCalledWith(`liquidationResult:
    account: ${result.account},
    success: ${result.success},
    profit: ${result.profit},
    txId: ${result.txId}`);
  });

  it('should get an account information from the blockchain', async () => {
    let asset0 = assetFactory();
    let asset1 = assetFactory({ chaindId: asset0.chainId });
    asset0 = await assetsService.registerAsset(asset0);
    asset1 = await assetsService.registerAsset(asset1);
    let market = marketFactory(asset0, asset1);
    market = await marketsService.registerMarket(market);
    let account = accountFactory(market);
    const newCollateral = new Decimal(120);
    account.collateralAmount = newCollateral;
    queryAccountsMock.mockReturnValue([account]);

    const queriedAccount = await service.getAccountInfoFromBlockchain(account);
    expect(queriedAccount.nftId).toEqual(account.nftId);
    expect(queriedAccount.marketId).toEqual(account.marketId);
    expect(queriedAccount.collateralAmount).toEqual(newCollateral);
  });

  it('should update the account in the database with the new information', async () => {
    const accountQuerySpy = jest.spyOn(service, 'getAccountInfoFromBlockchain');
    let asset0 = assetFactory();
    let asset1 = assetFactory({ chaindId: asset0.chainId });
    asset0 = await assetsService.registerAsset(asset0);
    asset1 = await assetsService.registerAsset(asset1);
    // creating market
    let market = marketFactory(asset0, asset1);
    market = await marketsService.registerMarket(market);
    // creating account
    let account = accountFactory(market);
    account = await marketsService.registerAccount(account);
    queryAccountsMock.mockReturnValue([account]);
    const result = new LiquidationResult(account, true, 1, '0x123');
    await service.completeLiquidation(result);
    expect(accountQuerySpy).toHaveBeenCalledWith(account);
  });
});
