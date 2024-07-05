import { CACHE_MANAGER, Inject, Injectable } from "@nestjs/common";
import axios from "axios";
import Decimal from "decimal.js";
import { BigNumber, ethers } from "ethers";
import { Asset } from "src/assets/entities/asset.entity";
import polygonRouter from "./abis/polygon-router";
import { Cache } from 'cache-manager';

const chaindIdToEndpoint = {
    1: "https://api.0x.org/",
    137: "https://polygon.api.0x.org/",
    56: "https://bsc.api.0x.org/",
    10: "https://optimism.api.0x.org/",
    250: "https://fantom.api.0x.org/",
    42220: "https://celo.api.0x.org/",
    43114: "https://avalanche.api.0x.org/",
    42161: "https://arbitrum.api.0x.org/"
}

export interface ZeroExTransform {
    to: string;
    transformations: {
        deploymentNonce: number,
        data: string
    }[]
}

@Injectable()
export class ZeroEx {

    ttl: number = 0;

    constructor(@Inject(CACHE_MANAGER) protected cache: Cache) {
        this.ttl = 1000 * 60 * 60
    }

    async getTransformation(sellAsset: Asset, buyAsset: Asset, sellAmount: BigNumber): Promise<ZeroExTransform> {
        const key = `getTransformation.${sellAsset.chainId}.${sellAsset.address}.${buyAsset.address}`;
        const cachedValue = await this.cache.get<ZeroExTransform>(key);
        if (cachedValue) {
            return cachedValue;
        }
        const response = await axios.get(`${chaindIdToEndpoint[sellAsset.chainId]}swap/v1/quote`, {
            params: {
                sellToken: sellAsset.address,
                buyToken: buyAsset.address,
                sellAmount: sellAmount.toString()
            }
        })
        const iface = new ethers.utils.Interface(polygonRouter)
        const calldata = iface.decodeFunctionData('transformERC20', response.data.data);
        const transform = {
            to: response.data.to,
            transformations: calldata.transformations
        }
        await this.cache.set(key, transform, this.ttl)
        return transform
    }
}