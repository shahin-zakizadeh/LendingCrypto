import { Network } from '@hovoh/evmcontractsregistry';
import { Asset } from '../assets/entities/asset.entity';
import { CoinGeckoService } from '../protocols/coingecko/CoinGecko.service';
import { VolumeEntry } from './VolumeEntry.entity';
import { MarketCapEntry } from './MarketCapEntry.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MarketsService } from '../lendingModule/markets.service';

@Injectable()
export class MetricTrackingService {
    coingecko: CoinGeckoService;
    markets: MarketsService;
    ignoredNetworks: number[] = [
        31337 // Hardhat TestNetwork
    ];
    constructor(
        coingecko: CoinGeckoService,
        markets: MarketsService,

        @InjectRepository(MarketCapEntry)
        public MarketCapEntries: Repository<MarketCapEntry>,

        @InjectRepository(VolumeEntry)
        public VolumeEntries: Repository<VolumeEntry>,
    ) {
        this.coingecko = coingecko;
        this.markets = markets;
    }
    private containsAsset(assets: Asset[], asset: Asset): boolean {
        return assets.some((a) => a.address === asset.address && a.chainId === asset.chainId);
    }
    private isInIgnoredNetworks(asset: Asset): boolean {
        return this.ignoredNetworks.includes(asset.chainId);
    }
    /**
        * @dev @param timeFrame is in Minutes => 1440= 24 -hours, 10080= 7-days, 43200= 30-days, 525600= 365-days
        * @dev @param source is the source of the data => 'coingecko' or 'lifi'
        * @dev @param AssetId is the id of the asset in the database
        * @dev @param timeStamp is the time when the data was collected
        * @param Cron is executed every 30 minutes
     */

    @Cron(CronExpression.EVERY_30_MINUTES)
    async cronJob() {
        const Assets = await this.getTrackedAssets();
        const assetsMarketCap = [];
        const assetsVolume = [];

        for (const asset of Assets) {
            const MarketCapEntryObject = new MarketCapEntry();
            MarketCapEntryObject.assetId = asset.id;
            MarketCapEntryObject.marketCap = await this.coingecko.getMarketCap(asset);
            MarketCapEntryObject.source = 'coingecko';
            assetsMarketCap.push(MarketCapEntryObject);

            const VolumeEntryObject = new VolumeEntry();
            VolumeEntryObject.assetId = asset.id;
            VolumeEntryObject.volume = await this.coingecko.getVolume(asset);
            VolumeEntryObject.timeFrame = 1440; // 24 hours in minutes
            VolumeEntryObject.source = 'coingecko';
            assetsVolume.push(VolumeEntryObject);
        }
        await this.MarketCapEntries.save(assetsMarketCap);
        await this.VolumeEntries.save(assetsVolume);
    }
    /**
     * @returns all assets that are tracked by the protocol
     * @param uniqueAssets is an array of all unique assets that are tracked by the protocol
     */
    async getTrackedAssets(): Promise<Asset[]> {
        const allMarkets = await this.markets.getAllMarkets();
        const uniqueAssets: Asset[] = [];

        for (const market of allMarkets) {
            const collateralToken = await market.collateralAsset;
            const principalToken = await market.principalAsset;

            if (!this.containsAsset(uniqueAssets, collateralToken)
                && !this.isInIgnoredNetworks(collateralToken)) {

                uniqueAssets.push(collateralToken);
            }
            if (!this.containsAsset(uniqueAssets, principalToken)
                && !this.isInIgnoredNetworks(principalToken)) {

                uniqueAssets.push(principalToken);
            }
        };
        return uniqueAssets;
    }

    async getMarketCap(asset: Asset): Promise<number> {
        const recentMarketCap = await this.MarketCapEntries.findOne({
            where: { assetId: asset.id },
            order: { timeStamp: "DESC" }
        });
        return recentMarketCap.marketCap;
    }
    async getVolume(asset: Asset): Promise<number> {
        const recentVolume = await this.VolumeEntries.findOne({
            where: { assetId: asset.id },
            order: { timeStamp: "DESC" }
        });
        return recentVolume.volume;
    }
}
