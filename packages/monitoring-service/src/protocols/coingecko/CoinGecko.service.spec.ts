import { CoinGeckoService } from '../../protocols/coingecko/CoinGecko.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Asset } from '../../assets/entities/asset.entity';
import { TestAppService } from '../../utils/test-module/test-app.service';
import { TestAppModule } from '../../utils/test-module/test-app.module';
import axios from 'axios';
jest.setTimeout(10000);

const BTC_ADDRESS = "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6"
const ETH_ADDRESS = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"

const btc = new Asset();
btc.chainId = 137;
btc.decimals = 8;
btc.address = BTC_ADDRESS;
const eth = new Asset();
eth.chainId = 137;
eth.decimals = 18;
eth.address = ETH_ADDRESS;

interface CGTokenPriceResponse {
    [address: string]: {
        usd: number;
        usd_market_cap: number;
        usd_24h_vol: number;
    }
}
describe('CoinGeckoService', () => {

    let testService: TestAppService;
    let coinGeckoService: CoinGeckoService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TestAppModule.register({ useDatabase: true }),
            ],
            providers: [CoinGeckoService],
        }).compile();
        testService = module.get<TestAppService>(TestAppService);
        coinGeckoService = module.get<CoinGeckoService>(CoinGeckoService);
    });

    it('Should return price, marketCap and volume', async () => {
        //BTC
        const BTCapiUrl = `https://api.coingecko.com/api/v3/simple/token_price/${coinGeckoService.chainIdToAssetPlatform(btc.chainId)}?contract_addresses=${btc.address}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true`;
        const BTCmarketCapFromCGService = await coinGeckoService.getMarketCap(btc);
        const axiosResponseBTC = await axios.get<CGTokenPriceResponse>(BTCapiUrl);
        const BTCmarketCap = axiosResponseBTC.data[btc.address.toLowerCase()].usd_market_cap
        expect(BTCmarketCapFromCGService).toEqual(BTCmarketCap);

        const BTCmarketVolumeFromCGService = await coinGeckoService.getVolume(btc);
        const BTCmarketVolume = axiosResponseBTC.data[btc.address.toLowerCase()].usd_24h_vol
        expect(BTCmarketVolumeFromCGService).toEqual(BTCmarketVolume);

        const BTCpriceFromCGService = await coinGeckoService.getPrice(btc);
        const BTCusdprice = axiosResponseBTC.data[btc.address.toLowerCase()].usd
        expect(BTCpriceFromCGService).toEqual(BTCusdprice);
    });

});