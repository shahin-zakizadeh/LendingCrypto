import { Prices } from '../../assets/prices.service';
import { AssetService } from '../../assets/asset.service';
import { MarketsService } from '../../lendingModule/markets.service';
import { LiFiService } from '../../protocols/amm/lifi/LiFi.service';
import { Test, TestingModule } from '@nestjs/testing';
import { SlippageService } from './slippage.service';
import { Asset } from '../../assets/entities/asset.entity';
import { SlippageEntry } from './SlippageEntry.entity';
import { BigNumber, BigNumberish } from 'ethers';
import { TestAppService } from '../../utils/test-module/test-app.service';
import { TestAppModule } from '../../utils/test-module/test-app.module';
import { polygonEth, polygonBtc } from '../../utils/test-module/factories/assets';
import { priceSourceFactory } from '../../utils/test-module/factories/price-source';
import { priceUpdateFactory } from '../../utils/test-module/factories/price-update';
import { AssetsModule } from '../../assets/assets.module';
import { PriceMonitor } from '../../assets/price-monitor.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketsModule } from '../../lendingModule/markets.module';
import { marketFactory } from '../../utils/test-module/factories/market';
import { bnToDecimal, decimalToBn } from '../../utils/precision-math';
import Decimal from 'decimal.js';
jest.setTimeout(10000);

describe('Slippage', () => {
  let slippageService: SlippageService;
  let marketsService: MarketsService;
  let assetService: AssetService;
  let testService: TestAppService;
  let pricesService: Prices;
  let priceMonitor: PriceMonitor;

  let estimateOutputMock = jest.fn()

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TestAppModule.register({ useDatabase: true }),
        TypeOrmModule.forFeature([SlippageEntry]),
        AssetsModule,
        MarketsModule,
      ],
      providers: [SlippageService]
    }).useMocker((token) => {
      if (token === LiFiService) {
        return {
          estimateOutput: estimateOutputMock
        }
      }
    }).compile();

    slippageService = module.get<SlippageService>(SlippageService);
    marketsService = module.get<MarketsService>(MarketsService);
    assetService = module.get<AssetService>(AssetService);
    testService = module.get<TestAppService>(TestAppService);
    pricesService = module.get<Prices>(Prices);
    priceMonitor = module.get<PriceMonitor>(PriceMonitor);
    await testService.prepareTest();
  });

  const setup = async (priceBtc: number, priceEth: number) => {
    const btc = await assetService.registerAsset(polygonBtc());
    const priceSourceBtc = await priceMonitor.registerPriceSource(priceSourceFactory(btc));
    const priceEntryBtc = await pricesService.addPrice(priceUpdateFactory(priceSourceBtc, { usdValue: priceBtc }));

    const eth = await assetService.registerAsset(polygonEth());
    const priceSourceEth = await priceMonitor.registerPriceSource(priceSourceFactory(eth));
    const priceEntryEth = await pricesService.addPrice(priceUpdateFactory(priceSourceEth, { usdValue: priceEth }));
    const market = await marketsService.registerMarket(marketFactory(btc, eth));
    const slippageValue = (priceBtc / priceEth) - (priceBtc / priceEth * 0.9)
    estimateOutputMock.mockImplementation((a0: Asset, a1: Asset, amount: BigNumber) => slippageValue)
    return { btc, eth, priceSourceBtc, priceSourceEth, priceEntryBtc, priceEntryEth, slippageValue, market };
  }

  afterAll(async () => {
    await testService?.tearDownTest();
  })

  it('Should return marketPrice ', async () => {
    const { btc, eth, slippageValue } = await setup(10, 1);
    const slippage = await slippageService.fetchSlippageEstimate(btc, eth, 10 ** btc.decimals * 100);
    expect(slippage).toEqual(slippageValue);
  });


  it("Should get all markets", async () => {
    const tradeSizes = [10000.0, 50000.0, 100000.0];
    const { btc, eth, market } = await setup(10, 1);
    await marketsService.registerMarket(market);
    await slippageService.scheduledSlippageQuery();

    for (const tradeSize of tradeSizes) {
      const estimatedSlippage = await slippageService.fetchSlippageEstimate(btc, eth, tradeSize);
      const estimatedSlippageFromDB = await slippageService.getEstimatedSlippage(btc, eth, tradeSize);
      expect(estimatedSlippageFromDB.slippage).toBeCloseTo(estimatedSlippage);
    }
  });

  it('should return the latest slippage entry', async () => {
    const tradeSize = 10000.0;
    let entryOneSlippage = 0.01;
    let entryTwoSlippage = 0.02;

    const { btc, eth, market } = await setup(10, 1);


    const entryOne = new SlippageEntry();
    entryOne.tradeSize = tradeSize;
    entryOne.slippage = entryOneSlippage;
    entryOne.fromAssetId = btc.id;
    entryOne.toAssetId = eth.id;
    await slippageService.slippageEntries.save(entryOne);

    const entryTwo = new SlippageEntry();
    entryTwo.tradeSize = tradeSize;
    entryTwo.slippage = entryTwoSlippage;
    entryTwo.fromAssetId = btc.id;
    entryTwo.toAssetId = eth.id;
    await slippageService.slippageEntries.save(entryTwo);

    const recentSlippage = await slippageService.getEstimatedSlippage(btc, eth, tradeSize);
    expect(recentSlippage.slippage).toEqual(entryTwoSlippage);
  });


  it("Should return null slippage", async () => {
    const sampleTradeSize = 10000.0;
    const btc = polygonBtc();
    const eth = polygonEth();
    /**
     * @dev No market exists, so slippage should be null
     */
    const estimatedSlippageFromDB = await slippageService.getEstimatedSlippage(btc, eth, sampleTradeSize);
    expect(estimatedSlippageFromDB).toBeNull();
  });

  it('Should return tokens in dollars', async () => {
    const tradeSizes = [10000.0, 50000.0, 100000.0];
    const { btc, eth, market } = await setup(10, 1);
    const btcPrice = (await pricesService.getPrice(btc)).usdValue;

    for (const tradeSize of tradeSizes) {
      const expectedTokens = decimalToBn(new Decimal(tradeSize).div(btcPrice), btc.decimals);
      const result = await slippageService.dollarsToTokens(btc, tradeSize);
      expect(result).toEqual(expectedTokens);
    }
  })
});
