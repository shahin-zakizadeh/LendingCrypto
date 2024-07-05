import { CacheModule } from '@nestjs/common';
import { LiFiService } from './LiFi.service';
import { Test, TestingModule } from '@nestjs/testing';
import { CoinGeckoService } from '../../coingecko/CoinGecko.service';
import { Asset } from '../../../assets/entities/asset.entity';
import { formatUnits } from 'ethers/lib/utils';
jest.setTimeout(30000);

describe('LiFiService', () => {
    let service: LiFiService;
    let coingecko: CoinGeckoService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [CacheModule.register()],
            providers: [LiFiService, CoinGeckoService],
        }).compile();
        service = module.get<LiFiService>(LiFiService);
        coingecko = module.get<CoinGeckoService>(CoinGeckoService);
    });

    it('Should return the quoted price', async () => {
        // Use CoinGecko api to fetch reference price
        const btc = new Asset();
        btc.chainId = 137;
        btc.decimals = 8;
        btc.address = "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6"
        const btcUsd = await coingecko.getPrice(btc);
        const eth = new Asset();
        eth.chainId = 137;
        eth.decimals = 18;
        eth.address = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
        const ethUsd = await coingecko.getPrice(eth);
        const btcEth = btcUsd / ethUsd; // ref market price


        const quote = await service.estimateOutput(btc, eth, 10 ** btc.decimals); //get quote for 1 token
        const quotedBtcEth = Number(formatUnits(quote, eth.decimals));
        // Verify the quote price is within a 2% threshold of the reference price
        expect(quotedBtcEth).toBeLessThan(btcEth * 1.04);
        expect(quotedBtcEth).toBeGreaterThan(btcEth * 0.96);
    });
});
