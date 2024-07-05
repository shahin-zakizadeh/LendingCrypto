import { Asset } from '../assets/entities/asset.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { marketFactory as marketFactory } from '../utils/test-module/factories/market';
import { TestAppModule } from '../utils/test-module/test-app.module';
import { TestAppService } from '../utils/test-module/test-app.service';
import { Repository } from 'typeorm';
import { assetFactory as assetFactory } from '../utils/test-module/factories/assets';
import { Account } from './entities/account.entity';
import { Market } from './entities/market.entity';
import { MarketsService } from './markets.service';
import { accountFactory } from '../utils/test-module/factories/account';

describe('MarketsService', function () {
  let testService: TestAppService;
  let assets: Repository<Asset>;
  let markets: MarketsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TestAppModule.register({ useDatabase: true }),
        TypeOrmModule.forFeature([Asset, Market, Account]),
      ],
      providers: [MarketsService],
    }).compile();
    testService = module.get<TestAppService>(TestAppService);
    assets = module.get<Repository<Asset>>(getRepositoryToken(Asset));
    markets = module.get<MarketsService>(MarketsService);
    await testService.prepareTest();
  });

  afterEach(async () => {
    await testService.closeDatabaseConnection();
  });

  it('Should register market', async () => {
    let asset0 = assetFactory();
    let asset1 = assetFactory({ chaindId: asset0.chainId });
    [asset0, asset1] = await assets.save([asset0, asset1]);
    let market0 = marketFactory(asset0, asset1);
    market0 = await markets.registerMarket(market0);
    const market1 = await markets.getMarket(market0.address, market0.chainId);
    expect(market0.id).toEqual(market1.id);
  });

  it('Should get all markets', async () => {
    let asset0 = assetFactory();
    let asset1 = assetFactory({ chaindId: asset0.chainId });
    [asset0, asset1] = await assets.save([asset0, asset1]);
    let market0 = marketFactory(asset0, asset1);
    market0 = await markets.registerMarket(market0);
    let allMarkets = await markets.getAllMarkets();
    expect(allMarkets.length).toEqual(1);
    expect(market0.id).toEqual(allMarkets[0].id);
    let asset2 = assetFactory();
    let asset3 = assetFactory({ chaindId: asset2.chainId });
    [asset2, asset3] = await assets.save([asset2, asset3]);
    let market1 = marketFactory(asset2, asset3);
    market1 = await markets.registerMarket(market1);
    allMarkets = await markets.getAllMarkets();
    expect(allMarkets.length).toEqual(2);
    expect(market0.id).toEqual(allMarkets[0].id);
    expect(market1.id).toEqual(allMarkets[1].id);
  });

  it('Should register market only once', async () => {
    let asset0 = assetFactory();
    let asset1 = assetFactory({ chaindId: asset0.chainId });
    [asset0, asset1] = await assets.save([asset0, asset1]);
    let market0 = marketFactory(asset0, asset1);
    const market1 = await markets.registerMarket(market0);
    market0 = await markets.registerMarket(market0);
    expect(market0.id).toEqual(market1.id);
  });

  it('Should register account', async () => {
    let asset0 = assetFactory();
    let asset1 = assetFactory({ chaindId: asset0.chainId });
    [asset0, asset1] = await assets.save([asset0, asset1]);
    let market = marketFactory(asset0, asset1);
    market = await markets.registerMarket(market);
    let account = accountFactory(market);
    const account0 = await markets.registerAccount(account);
    const account1 = await markets.getAccount(market, account.nftId);
    expect(account0.id).toEqual(account1.id);
  });

  it('Should register account only once', async () => {
    let asset0 = assetFactory();
    let asset1 = assetFactory({ chaindId: asset0.chainId });
    [asset0, asset1] = await assets.save([asset0, asset1]);
    let market = marketFactory(asset0, asset1);
    market = await markets.registerMarket(market);
    let account = accountFactory(market);
    const account0 = await markets.registerAccount(account);
    const account1 = await markets.registerAccount(account);
    expect(account0.id).toEqual(account1.id);
  });

  it('should update account since it exists', async () => {
    let asset0 = assetFactory();
    let asset1 = assetFactory({ chaindId: asset0.chainId });
    [asset0, asset1] = await assets.save([asset0, asset1]);
    let market = marketFactory(asset0, asset1);
    market = await markets.registerMarket(market);
    let account = accountFactory(market);
    const account0 = await markets.registerAccount(account);
    account0.interestIndex = account0.interestIndex.add(1);
    await markets.upsertAccount(account0);
    const account1 = await markets.getAccount(market, account.nftId);
    expect(account0.id).toEqual(account1.id);
    expect(account0.nftId).toEqual(account1.nftId);
    expect(account0.marketId).toEqual(account1.marketId);
    expect(account0.interestIndex).toEqual(account1.interestIndex);
  });

  it('should create a new account since it does not exist', async () => {
    let asset0 = assetFactory();
    let asset1 = assetFactory({ chaindId: asset0.chainId });
    [asset0, asset1] = await assets.save([asset0, asset1]);
    let market = marketFactory(asset0, asset1);
    await markets.registerMarket(market);
    market = await markets.getMarket(market.address, market.chainId);
    let account = accountFactory(market);
    await markets.upsertAccount(account);
    const account1 = await markets.getAccount(market, account.nftId);
    expect(account.id).toEqual(account1.id);
    expect(account.nftId).toEqual(account1.nftId);
    expect(account.marketId).toEqual(account1.marketId);
  });
});
