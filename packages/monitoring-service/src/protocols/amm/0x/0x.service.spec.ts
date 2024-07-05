import { CacheModule, CACHE_MANAGER } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import axios from "axios"
import { Cache } from "cache-manager"
import { ethers } from "ethers"
import { parseUnits } from "ethers/lib/utils"
import { polygonBtc, polygonEth } from "../../../utils/test-module/factories/assets"
import { ZeroEx, ZeroExTransform } from "./0x.service"
import polygonRouter from "./abis/polygon-router"

describe("0x api", () => {
    let service: ZeroEx;
    let cache: Cache;
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [CacheModule.register()],
            providers: [ZeroEx],
        }).compile();
        service = module.get<ZeroEx>(ZeroEx);
        cache = module.get<Cache>(CACHE_MANAGER);
    });

    it("Should query and cache quote", async () => {
        const btc = polygonBtc();
        const eth = polygonEth();
        const amount = parseUnits("1", btc.decimals);
        const response = await axios.get("https://polygon.api.0x.org/swap/v1/quote", {
            params: {
                sellToken: btc.address,
                buyToken: eth.address,
                sellAmount: amount.toString()
            }
        });
        const transformations = await service.getTransformation(btc, eth, amount);
        expect(transformations.to).toEqual(response.data.to);
        const transformationsCached = await cache.get<ZeroExTransform>(`getTransformation.${btc.chainId}.${btc.address}.${eth.address}`);
        expect(transformations.transformations.length).toEqual(transformationsCached.transformations.length);
    })

    it("Should get from cache", async () => {
        const btc = polygonBtc();
        const eth = polygonEth();
        const amount = parseUnits("1", btc.decimals);
        const key = `getTransformation.${btc.chainId}.${btc.address}.${eth.address}`;
        const transform = {
            to: "dawdad",
            transformations: []
        }
        await cache.set(key, transform)
        const transformations = await service.getTransformation(btc, eth, amount);
        expect(transformations).toStrictEqual(transform);
    })
})