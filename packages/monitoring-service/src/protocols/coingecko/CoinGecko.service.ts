import { Inject, Injectable, Get, CACHE_MANAGER } from '@nestjs/common';
import axios, { AxiosInstance, AxiosResponse, AxiosStatic } from 'axios';
import { Asset } from 'src/assets/entities/asset.entity';
import { Cache } from 'cache-manager';
import { Logger } from '@nestjs/common';
import axiosRetry from 'axios-retry';


//See asset_platforms https://www.coingecko.com/en/api/documentation
const chainIdToPlatformMap = {
    250: "fantom",
    137: "polygon-pos"
}
/**
 * @dev This interface is used to get price, market cap, and volume of assets from CoinGecko
 * @param address is the address of the aasset
 * @param usd is the price of the asset in USD
 * @param usd_market_cap is the market cap of the asset in USD
 * @param usd_24h_vol is the volume of the asset in USD
 */
interface CGTokenPriceResponse {
    [address: string]: {
        usd: number;
        usd_market_cap: number;
        usd_24h_vol: number;
    }
}

/** 
@dev This service is used to get price, market cap, and volume of assets from CoinGecko
@dev This service using CacheManager to cache the results
@dev This service is using axios to make API calls
@dev This service using CacheManager to cache the results
@param ttl is the time to live of the cache in milliseconds
*/
@Injectable()
export class CoinGeckoService {
    ttl: number;
    axiosClient: AxiosInstance;
    protected readonly logger = new Logger(CoinGeckoService.name);
    constructor(
        @Inject(CACHE_MANAGER) protected cacheManager: Cache,
    ) {
        this.axiosClient = axios.create({
            baseURL: 'https://api.coingecko.com/api/v3/simple/token_price/',
            timeout: 10000,
        })
        this.ttl = 3 * 60 * 1000;
        // @ts-ignore 
        axiosRetry(this.axiosClient, {
            retries: 3,
            retryDelay: (retryCount, error) => {
                if (error.response || error.response.status === 429) {
                    this.logger.log(`Too many requests, delaying next query by 1 minute.`);
                    return 60000; // 1 minute
                } else {
                    const delay = retryCount * 3000;
                    this.logger.log(`Retrying request in ${delay}ms (attempt ${retryCount + 1})...`);
                    return delay;
                }
            },
            shouldResetTimeout: true,
            retryCondition: (error) => error.response?.status >= 500,
        });
    }

    chainIdToAssetPlatform(chainId: number): string {
        return chainIdToPlatformMap[chainId];
    }
    /**
    @dev Get price of an asset in USD
    @param asset Asset to get price of
    @return Price of asset in USD 
    */
    async getPrice(asset: Asset): Promise<number> {

        const readPriceData = await this.cacheManager.get<number>(this.getPriceCacheKey(asset));
        if (readPriceData) {
            return readPriceData;
        } else {
            await this.fetchStats(asset);
            const cachedPriceData = await this.cacheManager.get<number>(this.getPriceCacheKey(asset));
            return cachedPriceData;
        }
    }
    /**
    @dev Get market cap of an asset in USD
    @param asset Asset to get market cap of
    @return Market cap of asset in USD
    */
    async getMarketCap(asset: Asset): Promise<number> {

        const readMarketCapData = await this.cacheManager.get<number>(this.getMarketCapCacheKey(asset));
        if (readMarketCapData) {
            return readMarketCapData;
        } else {
            await this.fetchStats(asset);
            const cachedMarketCapData = await this.cacheManager.get<number>(this.getMarketCapCacheKey(asset));
            return cachedMarketCapData;
        }
    }
    /**
    @dev Get 24 hour volume of an asset in USD
    @param asset Asset to get 24 hour volume of
    @return 24 hour volume of asset in USD
    */
    async getVolume(asset: Asset): Promise<number> {
        const readVolumeData = await this.cacheManager.get<number>(this.getVolumeCacheKey(asset));
        if (readVolumeData) {
            return readVolumeData;
        } else {
            await this.fetchStats(asset);
            const cachedVolumeData = await this.cacheManager.get<number>(this.getVolumeCacheKey(asset));
            return cachedVolumeData;
        }
    }
    private getPriceCacheKey(asset: Asset) {

        const priceKey = `coingecko.token_price.${asset.chainId}.${asset.address}`;
        return priceKey;
    }
    private getMarketCapCacheKey(asset: Asset) {

        const marketcapKey = `coingecko.token_price.marketcap.${asset.chainId}.${asset.address}`;
        return marketcapKey;
    }
    private getVolumeCacheKey(asset: Asset) {

        const volumeKey = `coingecko.token_price.volume.${asset.chainId}.${asset.address}`;
        return volumeKey;
    }
    /**
     * 
     * @param asset Asset to get stats of
     * @returns Price, market cap, and volume of asset in USD
     * @dev This function is used to fetch price, market cap, and volume of an asset from CoinGecko
     */
    private async fetchStats(asset: Asset): Promise<void> {

        const apiUrl = `https://api.coingecko.com/api/v3/simple/token_price/${this.chainIdToAssetPlatform(asset.chainId)}?contract_addresses=${asset.address}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true`;

        try {
            const axiosResponse = await this.axiosClient.get<CGTokenPriceResponse>(apiUrl);

            const usdPrice = axiosResponse.data[asset.address.toLowerCase()].usd;
            await this.cacheManager.set(
                this.getPriceCacheKey(asset),
                usdPrice,
                this.ttl
            );
            const marketCap = axiosResponse.data[asset.address.toLowerCase()].usd_market_cap;
            await this.cacheManager.set(
                this.getMarketCapCacheKey(asset),
                marketCap,
                this.ttl
            );
            const oneDayVolume = axiosResponse.data[asset.address.toLowerCase()].usd_24h_vol;
            await this.cacheManager.set(
                this.getVolumeCacheKey(asset),
                oneDayVolume,
                this.ttl
            );
        }
        catch (error) {
            const { status, statusText, headers } = error.response;
            if (status >= 400 && status <= 599) {
                this.logger.error(`CoinGecko call failed with status ${status} ${statusText}`, {
                    apiUrl,
                    headers,
                });
            }
            throw error;
        }
    }
}
