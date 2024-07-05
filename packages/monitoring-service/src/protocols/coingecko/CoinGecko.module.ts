import { Module, CacheModule } from '@nestjs/common';
import { CoinGeckoService } from './CoinGecko.service';


@Module({
    imports: [],
    providers: [CoinGeckoService],
    exports: [CoinGeckoService],
})
export class CoinGeckoModule { }

