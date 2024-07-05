import { MarketsService } from '../lendingModule/markets.service';
import { VolumeEntry } from './VolumeEntry.entity';
import { MarketCapEntry } from './MarketCapEntry.entity';
import { CoinGeckoService } from '../protocols/coingecko/CoinGecko.service';
import { AssetService } from '../assets/asset.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Asset } from '../assets/entities/asset.entity';
import { Account } from '../lendingModule/entities/account.entity';
import { TestAppService } from '../utils/test-module/test-app.service';
import { TestAppModule } from '../utils/test-module/test-app.module';
import { MetricTrackingService } from './metric-tracking.service';
import { Market } from '../lendingModule/entities/market.entity';
import {
  BTC_ADDRESS, ETH_ADDRESS, USDC_ADDRESS,
  polygonBtc, polygonEth, polygonUsdc, hardhatTestNetworkBtc
} from '../utils/test-module/factories/assets';

import { marketFactory } from '../utils/test-module/factories/market';
jest.setTimeout(60000);

describe('MetricTracking', () => {
  let marketsService: MarketsService;
  let assetService: AssetService;
  let testService: TestAppService;
  let metricTrackingService: MetricTrackingService;
  let coinGeckoService: CoinGeckoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TestAppModule.register({ useDatabase: true }),
        TypeOrmModule.forFeature([Market, Asset, Account, MarketCapEntry, VolumeEntry]),
      ],
      providers: [MarketsService, AssetService, CoinGeckoService, MetricTrackingService],
    }).compile();
    marketsService = module.get<MarketsService>(MarketsService);
    assetService = module.get<AssetService>(AssetService);
    testService = module.get<TestAppService>(TestAppService);
    metricTrackingService = module.get<MetricTrackingService>(MetricTrackingService);
    coinGeckoService = module.get<CoinGeckoService>(CoinGeckoService);
    await testService.prepareTest();
  });
  afterAll(async () => {
    await testService?.tearDownTest();
  })

  it('Should return uniqueTrackedAssets', async () => {

    const btcAsset = await assetService.registerAsset(polygonBtc());
    const ethAsset = await assetService.registerAsset(polygonEth());
    const usdcAsset = await assetService.registerAsset(polygonUsdc());
    await marketsService.registerMarket(marketFactory(btcAsset, ethAsset));
    await marketsService.registerMarket(marketFactory(ethAsset, usdcAsset));

    const trackedAssets = await metricTrackingService.getTrackedAssets();
    const trackedAssetsAddress = trackedAssets.map((asset) => asset.address);

    expect(trackedAssetsAddress).toContain(BTC_ADDRESS);
    expect(trackedAssetsAddress).toContain(ETH_ADDRESS);
    expect(trackedAssetsAddress).toContain(USDC_ADDRESS);
    expect(trackedAssetsAddress.length).toBe(3);
  });

  it('Should cronJob save uniqueAssets MarketCap and Volume', async () => {

    const btcAsset = await assetService.registerAsset(polygonBtc());
    const ethAsset = await assetService.registerAsset(polygonEth());
    const usdcAsset = await assetService.registerAsset(polygonUsdc());
    await marketsService.registerMarket(marketFactory(btcAsset, ethAsset));
    await marketsService.registerMarket(marketFactory(ethAsset, usdcAsset));

    const trackedAssets = await metricTrackingService.getTrackedAssets();
    await metricTrackingService.cronJob();

    for (const asset of trackedAssets) {

      const cronJobMarketCap = await metricTrackingService.getMarketCap(asset);
      const cronJobVolume = await metricTrackingService.getVolume(asset);

      const coinGeckoMarketCap = await coinGeckoService.getMarketCap(asset);
      const coinGeckoVolume = await coinGeckoService.getVolume(asset);

      expect(cronJobMarketCap).toEqual(coinGeckoMarketCap);
      expect(cronJobVolume).toEqual(coinGeckoVolume);
    }
  });
  it('Should not return ignoredNetworks assets', async () => {

    const btcAsset = await assetService.registerAsset(polygonBtc());
    const ethAsset = await assetService.registerAsset(polygonEth());
    const usdcAsset = await assetService.registerAsset(polygonUsdc());
    const btcAssetHardhat = await assetService.registerAsset(hardhatTestNetworkBtc());
    await marketsService.registerMarket(marketFactory(btcAsset, ethAsset));
    await marketsService.registerMarket(marketFactory(ethAsset, usdcAsset));
    await marketsService.registerMarket(marketFactory(btcAssetHardhat, ethAsset));

    const trackedAssets = await metricTrackingService.getTrackedAssets();
    const trackedAssetsAddress = trackedAssets.map((asset) => asset.address);

    expect(trackedAssetsAddress).toContain(BTC_ADDRESS);
    expect(trackedAssetsAddress).toContain(ETH_ADDRESS);
    expect(trackedAssetsAddress).toContain(USDC_ADDRESS);
    expect(trackedAssetsAddress).not.toContain(btcAssetHardhat.address);
    expect(trackedAssetsAddress.length).toBe(3);
  });
});