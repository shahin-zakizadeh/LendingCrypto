import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import Decimal from "decimal.js";
import { polygonBtc, polygonEth } from "../utils/test-module/factories/assets";
import { priceSourceFactory } from "../utils/test-module/factories/price-source";
import { TestAppModule } from "../utils/test-module/test-app.module";
import { TestAppService } from "../utils/test-module/test-app.service";
import { AssetService } from "./asset.service";
import { Asset } from "./entities/asset.entity";
import { PriceEntry } from "./entities/price-entry.entity";
import { PriceSource } from "./entities/price-source.entity";
import { PriceUpdate } from "./events/price-update.event";
import { PriceMonitor } from "./price-monitor.service";
import { Prices } from "./prices.service";

describe("PricesService", function () {
    let testService: TestAppService;
    let prices: Prices;
    let assets: AssetService;
    let priceMonitor: PriceMonitor;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [TestAppModule.register({ useDatabase: true }), TypeOrmModule.forFeature([Asset, PriceSource, PriceEntry])],
            providers: [Prices, PriceMonitor, AssetService],
        }).compile();

        prices = module.get<Prices>(Prices);
        testService = module.get<TestAppService>(TestAppService);
        assets = module.get<AssetService>(AssetService);
        priceMonitor = module.get<PriceMonitor>(PriceMonitor);
        await testService.prepareTest();
    });

    afterEach(async () => {
        await testService.closeDatabaseConnection();
    });

    it("Should save a new price entry", async () => {
        const asset = await assets.registerAsset(polygonEth());
        const ps = await priceMonitor.registerPriceSource(priceSourceFactory(asset));
        const price = new Decimal('1.1');
        const priceUpdate = new PriceUpdate(ps, new Date(), price, price)
        await prices.addPrice(priceUpdate);
        const savedPrice = await prices.getPrice(asset, ps);
        expect(savedPrice.usdValue).toEqual(price)
    })

    it("Should get latest price entry", async () => {
        const asset = await assets.registerAsset(polygonEth());
        const ps = await priceMonitor.registerPriceSource(priceSourceFactory(asset));
        const price0 = new Decimal('1.1');
        await prices.addPrice(new PriceUpdate(ps, new Date(), price0, price0));
        const price1 = new Decimal('1.2');
        const priceUpdate = new PriceUpdate(ps, new Date(Date.now() + 1000), price1, price1)
        await prices.addPrice(priceUpdate);
        const savedPrice = await prices.getPrice(asset, ps);
        expect(savedPrice.usdValue).toEqual(price1)
    })

    it("Should get latest price entry from specific source", async () => {
        const asset = await assets.registerAsset(polygonEth());
        const ps0 = await priceMonitor.registerPriceSource(priceSourceFactory(asset));
        const price0 = new Decimal('1.1');
        await prices.addPrice(new PriceUpdate(ps0, new Date(), price0, price0));
        const price1 = new Decimal('1.2');
        const ps1 = await priceMonitor.registerPriceSource(priceSourceFactory(asset));
        const priceUpdate = new PriceUpdate(ps1, new Date(Date.now() + 1000), price1, price1)
        await prices.addPrice(priceUpdate);
        const savedPrice = await prices.getPrice(asset, ps0);
        expect(savedPrice.usdValue).toEqual(price0)
    })

    it("Should save price entry an calculate usd price", async () => {
        const eth = await assets.registerAsset(polygonEth());
        const btc = await assets.registerAsset(polygonBtc());
        const ps0 = await priceMonitor.registerPriceSource(priceSourceFactory(eth, { denominatorId: btc.id }));

        const priceBtcUsd = new Decimal('10000');
        const ps1 = await priceMonitor.registerPriceSource(priceSourceFactory(btc))
        const priceUpdate = new PriceUpdate(ps1, new Date(), priceBtcUsd, priceBtcUsd)
        await prices.addPrice(priceUpdate);

        const priceEthBtc = new Decimal('0.05');
        await prices.addPrice(new PriceUpdate(ps0, new Date(), priceEthBtc));

        const savedPrice = await prices.getPrice(eth, ps0);
        expect(savedPrice.usdValue).toEqual(priceEthBtc.mul(priceBtcUsd))
        expect(savedPrice.value).toEqual(priceEthBtc);
    })

    it("Should truncate to 18 decimals", async () => {
        const asset = await assets.registerAsset(polygonEth());
        const ps = await priceMonitor.registerPriceSource(priceSourceFactory(asset));
        const price = new Decimal('1.123456789123456789123456789');
        const priceUpdate = new PriceUpdate(ps, new Date(), price, price)
        await prices.addPrice(priceUpdate);
        const savedPrice = await prices.getPrice(asset, ps);
        expect(savedPrice.usdValue).toEqual(price.toDecimalPlaces(18, Decimal.ROUND_FLOOR))
    })

    it("Should get an error if price is null", async () => {
        const asset = await assets.registerAsset(polygonEth());
        const ps = await priceMonitor.registerPriceSource(priceSourceFactory(asset));
        await expect(prices.getPrice(asset, ps)).rejects.toThrow(new Error(`No price found for asset ${asset.id} and price source ${ps.id}`));
    });

})