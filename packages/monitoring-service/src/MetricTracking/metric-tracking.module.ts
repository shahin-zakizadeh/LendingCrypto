import { CoinGeckoModule } from '../protocols/coingecko/CoinGecko.module';
import { VolumeEntry } from './VolumeEntry.entity';
import { MarketCapEntry } from './MarketCapEntry.entity';
import { MetricTrackingService } from './metric-tracking.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsModule } from '../assets/assets.module';
import { MarketsModule } from '../lendingModule/markets.module';
import { SlippageModule } from './slippage/slippage.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([MarketCapEntry, VolumeEntry]),
        CoinGeckoModule,
        MarketsModule,
        AssetsModule,
        SlippageModule
    ],
    providers: [MetricTrackingService],
    exports: [MetricTrackingService, SlippageModule],
})
export class MetricTrackingModule { }