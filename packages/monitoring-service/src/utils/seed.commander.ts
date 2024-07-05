import { PriceSource } from './../assets/entities/price-source.entity';
import { Command, CommandRunner, Option } from 'nest-commander';
import { Logger } from '@nestjs/common';
import { polygonEth, polygonBtc, polygonUsdc } from '../utils/test-module/factories/assets';
import { Prices } from '../assets/prices.service';
import { MarketsService } from '../lendingModule/markets.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetService } from '../assets/asset.service';
import { marketFactory } from '../utils/test-module/factories/market';
import { priceUpdateFactory } from '../utils/test-module/factories/price-update';
import { priceSourceFactory } from '../utils/test-module/factories/price-source';
import { accountFactory } from '../utils/test-module/factories/account';
import Decimal from 'decimal.js';
import { Account } from '../lendingModule/entities/account.entity';

@Command({ name: 'seed', description: 'For Seed and Testing DataBase' })
export class Seed extends CommandRunner {
    prices: Prices;
    markets: MarketsService;
    assets: AssetService;
    protected readonly logger = new Logger(Seed.name);

    constructor(
        prices: Prices,
        markets: MarketsService,
        assetService: AssetService,
        @InjectRepository(PriceSource)
        public priceSources: Repository<PriceSource>
    ) {
        super();
        this.prices = prices;
        this.markets = markets;
        this.assets = assetService;
    }

    async run() {
        this.logger.log('Seeding Database');
        await this.seed();
        this.logger.log('Seeding Database Done');
    }

    async seed() {

        let liquidableAccounts: Account[] = [];
        const btcAsset = await this.assets.registerAsset(polygonBtc());
        const ethAsset = await this.assets.registerAsset(polygonEth());
        const usdcAsset = await this.assets.registerAsset(polygonUsdc());

        const marketBTC_ETH = await this.markets.registerMarket(marketFactory(btcAsset, ethAsset, {
            interestIndex: new Decimal(4),
            liquidationThreshold: new Decimal(1.2),
        }));
        const marketETH_USDC = await this.markets.registerMarket(marketFactory(ethAsset, usdcAsset, {
            interestIndex: new Decimal(6),
            liquidationThreshold: new Decimal(1.4),
        }));
        const marketBTC_USDC = await this.markets.registerMarket(marketFactory(btcAsset, usdcAsset, {
            interestIndex: new Decimal(8),
            liquidationThreshold: new Decimal(1.6),
        }));

        const accountliquidableMarketBTC_ETH = accountFactory(marketBTC_ETH, {
            collateralAmount: new Decimal(101),
            principalAmount: new Decimal(50),
            interestIndex: new Decimal(1.1),
        });
        await this.markets.registerAccount(accountliquidableMarketBTC_ETH);
        liquidableAccounts.push(accountliquidableMarketBTC_ETH);

        const accountNotliquidableMarketBTC_ETH = accountFactory(marketBTC_ETH, {
            collateralAmount: new Decimal(102),
            principalAmount: new Decimal(50),
            interestIndex: new Decimal(1.7),
        });
        await this.markets.registerAccount(accountNotliquidableMarketBTC_ETH);

        const accountAtliquidableEdgeMarketBTC_ETH = accountFactory(marketBTC_ETH, {
            collateralAmount: new Decimal(100),
            principalAmount: new Decimal(33),
            interestIndex: new Decimal(1.1),
        });
        await this.markets.registerAccount(accountAtliquidableEdgeMarketBTC_ETH);

        const accountliquidableMarketETH_USDC = accountFactory(marketETH_USDC, {
            collateralAmount: new Decimal(150),
            principalAmount: new Decimal(75),
            interestIndex: new Decimal(1.2),
        });
        await this.markets.registerAccount(accountliquidableMarketETH_USDC);
        liquidableAccounts.push(accountliquidableMarketETH_USDC);

        const accountNotliquidableMarketETH_USDC = accountFactory(marketETH_USDC, {
            collateralAmount: new Decimal(150),
            principalAmount: new Decimal(30),
            interestIndex: new Decimal(1.2),
        });
        await this.markets.registerAccount(accountNotliquidableMarketETH_USDC);

        const accountAtliquidableEdgeMarketETH_USDC = accountFactory(marketETH_USDC, {
            collateralAmount: new Decimal(150),
            principalAmount: new Decimal(49),
            interestIndex: new Decimal(1.4),
        });
        await this.markets.registerAccount(accountAtliquidableEdgeMarketETH_USDC);

        const accountliquidableMarketBTC_USDC = accountFactory(marketBTC_USDC, {
            collateralAmount: new Decimal(180),
            principalAmount: new Decimal(100),
            interestIndex: new Decimal(1.3),
        });
        await this.markets.registerAccount(accountliquidableMarketBTC_USDC);
        liquidableAccounts.push(accountliquidableMarketBTC_USDC);

        const accountNotliquidableMarketBTC_USDC = accountFactory(marketBTC_USDC, {
            collateralAmount: new Decimal(180),
            principalAmount: new Decimal(40),
            interestIndex: new Decimal(1.4),
        });
        await this.markets.registerAccount(accountNotliquidableMarketBTC_USDC);

        const accountAtliquidableEdgeMarketBTC_USDC = accountFactory(marketBTC_USDC, {
            collateralAmount: new Decimal(180),
            principalAmount: new Decimal(45),
            interestIndex: new Decimal(1.25),
        });
        await this.markets.registerAccount(accountAtliquidableEdgeMarketBTC_USDC);

        const emptyAccount = accountFactory(marketBTC_ETH, {
            collateralAmount: new Decimal(0),
            principalAmount: new Decimal(0),
            interestIndex: new Decimal(0),
        })
        await this.markets.registerAccount(emptyAccount);

        const priceSourceBTC = priceSourceFactory(btcAsset, {})
        await this.priceSources.save(priceSourceBTC);

        const priceSourceETH = priceSourceFactory(ethAsset, {})
        await this.priceSources.save(priceSourceETH);

        const priceSourceUSDC = priceSourceFactory(usdcAsset, {})
        await this.priceSources.save(priceSourceUSDC);

        const BTCPriceUpdate = priceUpdateFactory(priceSourceBTC, {
            usdValue: new Decimal(50000),
            value: new Decimal(1),
        })
        await this.prices.addPrice(BTCPriceUpdate);

        const ETHPriceUpdate = priceUpdateFactory(priceSourceETH, {
            usdValue: new Decimal(25000),
            value: new Decimal(1),
        })
        await this.prices.addPrice(ETHPriceUpdate);

        const USDCPriceUpdate = priceUpdateFactory(priceSourceUSDC, {
            usdValue: new Decimal(10000),
            value: new Decimal(1),
        })
        await this.prices.addPrice(USDCPriceUpdate);

        return liquidableAccounts;
    }
}