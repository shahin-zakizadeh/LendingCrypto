import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetService } from '../../../assets/asset.service';
import { Asset } from '../../../assets/entities/asset.entity';
import { LendingClubService } from '../LendingClubApi.service';
import { TestAppModule } from '../../../utils/test-module/test-app.module';
import { TestAppService } from '../../../utils/test-module/test-app.service';
import { EvmProviderModule } from '../../../evm/providers/evm-provider.module';
import { LendingClubSyncService } from './LendingClubSync.service';
import { EvmTokensService } from '../../../evm/tokens/evm-tokens.service';
import { MarketsService } from '../../../lendingModule/markets.service';
import { Market } from '../../../lendingModule/entities/market.entity';
import { Account } from '../../../lendingModule/entities/account.entity';
import { AssetsModule } from '../../../assets/assets.module';
import { EvmTokensModule } from '../../../evm/tokens/evm-tokens.module';
import { MarketsModule } from '../../../lendingModule/markets.module';
import { LendingClubModule } from '../LendingClub.module';
import { parseEther } from 'ethers/lib/utils';

describe('LendingClubSyncService', () => {
  let syncService: LendingClubSyncService;
  let lcService: LendingClubService;
  let evmTokensService: EvmTokensService;
  let marketService: MarketsService;
  let assetService: AssetService;
  let testService: TestAppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TestAppModule.register({ useDatabase: true, useHardhat: true }),
        TypeOrmModule.forFeature([Asset, Market, Account]),
        EvmProviderModule,
        LendingClubModule,
        MarketsModule,
        EvmTokensModule,
        AssetsModule,
      ],
      providers: [LendingClubSyncService, LendingClubService],
    }).compile();

    syncService = module.get<LendingClubSyncService>(LendingClubSyncService);
    lcService = module.get<LendingClubService>(LendingClubService);
    evmTokensService = module.get<EvmTokensService>(EvmTokensService);
    marketService = module.get<MarketsService>(MarketsService);
    testService = module.get<TestAppService>(TestAppService);
    assetService = module.get<AssetService>(AssetService);
    await testService.prepareTest();
    await syncService.sync();
  });

  afterEach(async () => {
    await testService.tearDownTest();
  });

  it('should be defined', () => {
    expect(syncService).toBeDefined();
  });

  describe('AssetSync', () => {
    it('should read all assets from given markets and save them to DB', async () => {
      const markets = await lcService.loadMarkets();
      expect(markets.length).toBeGreaterThanOrEqual(1);
      await syncService.syncAssets(markets);
      const assets: Asset[] = [];
      for (const market of markets) {
        assets.push(await market.collateralAsset);
        assets.push(await market.principalAsset);
      }
      for (const asset of assets) {
        const dbAsset = await assetService.getAsset(
          asset.address,
          asset.chainId,
        );
        expect(dbAsset).toBeDefined();
      }
    });
  });

  describe('MarketSync', () => {
    it('should read all markets from given markets and save them to DB', async () => {
      const markets = await lcService.loadMarkets();
      expect(markets.length).toBeGreaterThanOrEqual(1);
      await syncService.syncAssets(markets);
      await syncService.syncMarkets(markets);
      for (const market of markets) {
        const dbMarket = await marketService.getMarket(
          market.address,
          market.chainId,
        );
        expect(dbMarket).toBeDefined();
      }
    });
  });

  describe('AccountSync', () => {

    it('a new account gets created and markets should get updated in DB', async () => {
      const { market, wBtcToken } = await testService.getHardhatContracts(lcService);
      const wbtcMarketEntity = await marketService.getMarket(
        market.address,
        31337,
      );
      const lastSync = wbtcMarketEntity.lastSync;
      marketService.getAllMarkets = jest.fn().mockReturnValue(Promise.resolve([
        wbtcMarketEntity
      ]))
      const userAddress = '0x27Ca8e71026ea079Ba8a3EF5d6e51ac4b962c0A3';
      const signer = await testService.impersonateAccount(userAddress);
      await wBtcToken.connect(signer).mint(userAddress, parseEther('1000000'));
      await wBtcToken
        .connect(signer)
        .approve(market.address, parseEther('1000000'));

      await testService.mineBlock();
      // open account
      const accountId = await market.totalAccountsCreated()
      await market.connect(signer).openAccount();
      // mine a block to make sure the event is emitted
      await testService.mineBlock();

      await syncService.syncAccounts();
      const wBtcMarketNew = await marketService.getMarket(
        market.address,
        31337,
      );
      expect(wBtcMarketNew.lastSync).toBeGreaterThan(lastSync);
      const account = await marketService.getAccount(wBtcMarketNew, accountId.toNumber());
      expect(account).toBeDefined;
    });
  });
});
