import { Repository } from 'typeorm';
import { LiFiService } from '../../protocols/amm/lifi/LiFi.service';
import { Injectable } from '@nestjs/common';
import { BigNumber, BigNumberish } from 'ethers';
import { Prices } from '../../assets/prices.service';
import { Asset } from '../../assets/entities/asset.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { SlippageEntry } from './SlippageEntry.entity';
import { MarketsService } from '../../lendingModule/markets.service';
import { bnToDecimal, decimalToBn } from '../../utils/precision-math';
import { Logger } from '@nestjs/common';
import Decimal from 'decimal.js';
import retry from 'retry';
import { CronJob } from 'cron';

@Injectable()
export class SlippageService {
    lifi: LiFiService;
    prices: Prices;
    markets: MarketsService;
    protected readonly logger = new Logger(SlippageService.name);
    constructor(
        lifi: LiFiService,
        prices: Prices,
        markets: MarketsService,
        @InjectRepository(SlippageEntry)
        public slippageEntries: Repository<SlippageEntry>
    ) {
        this.lifi = lifi;
        this.prices = prices;
        this.markets = markets;
        const job = new CronJob(CronExpression.EVERY_30_MINUTES, this.scheduledSlippageQuery.bind(this));
        if (process.env.NODE_ENV != "test") {
            job.start();
        }
    }

    /**
    @param fromAsset Asset that is being traded in
    @param toAsset Asset received
    @dev fetch and save to db the slippage for different trade sizes
     */
    async scheduledSlippageQuery() {

        const allMarkets = await this.markets.getAllMarkets();
        const estimatedSlippageOfMarkets = [];
        const tradeSizes = [10000.0, 50000.0, 100000.0];

        for (const tradeSize of tradeSizes) {

            for (const marketSize of allMarkets) {

                const fromAsset = await marketSize.collateralAsset;
                const toAsset = await marketSize.principalAsset;
                const tradeSizeInTokens = await this.dollarsToTokens(fromAsset, tradeSize); // convert trade size from dollars to tokens

                const estimatedSlippage = await this.fetchSlippageEstimate(fromAsset, toAsset, tradeSizeInTokens);
                const SlippageEntryObject = new SlippageEntry();
                SlippageEntryObject.fromAsset = fromAsset;
                SlippageEntryObject.toAsset = toAsset;
                SlippageEntryObject.tradeSize = tradeSize;
                SlippageEntryObject.slippage = estimatedSlippage;
                SlippageEntryObject.fromAssetId = fromAsset.id;
                SlippageEntryObject.toAssetId = toAsset.id;

                estimatedSlippageOfMarkets.push(SlippageEntryObject);
            }
        }
        await this.slippageEntries.save(estimatedSlippageOfMarkets);
    }

    async getEstimatedSlippage(fromAsset: Asset, toAsset: Asset, tradeSize: number): Promise<SlippageEntry | null> {

        const fetchedRecentSlippage = await this.slippageEntries.findOne({
            where: { fromAssetId: fromAsset.id, toAssetId: toAsset.id, tradeSize },
            order: { timestamp: 'DESC' },
        });
        return fetchedRecentSlippage;

    }
    /**
     * @param fromAsset Asset that is being traded in
     * @param toAsset Asset received
     * @param amount amount of the `fromAsset`
     * @returns the percentage of slippage
     * @dev This function is using getPrice to get the price of the assets
     * @dev This function is using estimateOutput to get the estimated output of the trade
     */
    async fetchSlippageEstimate(fromAsset: Asset, toAsset: Asset, amount: BigNumberish): Promise<number> {
        const priceFrom = await this.prices.getPrice(fromAsset);
        const priceTo = await this.prices.getPrice(toAsset);
        const priceFromTo = priceFrom.usdValue.div(priceTo.usdValue);
        try {
            const estimatedOutput = await this.estimateOutput(fromAsset, toAsset, amount);
            const outputPrice = bnToDecimal(estimatedOutput, toAsset.decimals).div(bnToDecimal(amount, fromAsset.decimals))
            return (priceFromTo.sub(outputPrice)).div(priceFromTo).toNumber();
        }
        catch (error) {
            this.logger.error(`Error in fetchSlippage from LiFi service after 3 retry attempts: ${error}, 
            fromAsset: ${fromAsset.address},
            toAsset: ${toAsset.address},
            chainId: ${fromAsset.chainId}, 
            amount: ${amount}`);
            return 1;
        }
    }
    /**
     * @param fromAsset Asset that is being traded in
     * @param toAsset Asset received
     * @param amount amount of the `fromAsset`
     * @returns the estimated output of the trade
     * @dev reytry operation is using exponential backoff
     * @dev https://www.npmjs.com/package/retry
     */
    async estimateOutput(fromAsset: Asset, toAsset: Asset, amount: BigNumberish): Promise<BigNumber> {
        let operation = retry.operation({
            retries: 3,
            minTimeout: 3 * 1000,
            maxTimeout: 60 * 1000,
        });
        return new Promise((resolve, reject) => {
            operation.attempt(async (currentAttempt) => {
                try {
                    const estimatedOutput = await this.lifi.estimateOutput(fromAsset, toAsset, amount);
                    resolve(estimatedOutput);
                }
                catch (error) {
                    this.logger.error(`Error in estimateOutput from LiFi service: ${error}`);
                    if (operation.retry(error)) {
                        return;
                    }
                    reject(operation.mainError());
                }
            });
        });
    }
    /**
     * @param asset Asset that is being traded in
     * @param amountInDollars amount of dollars
     * @returns the amount of tokens that can be bought with the amount of dollars
     * @dev Decimal.js is used to avoid precision errors
     * @dev https://www.npmjs.com/package/decimal.js
     * @dev decimalToBn is used to convert the decimal to BigNumber
     */
    async dollarsToTokens(asset: Asset, amountInDollars: number): Promise<BigNumber> {
        const price = await this.prices.getPrice(asset);
        const amountOfTokens = new Decimal(amountInDollars).div(price.usdValue)
        return decimalToBn(amountOfTokens, asset.decimals);
    }
}