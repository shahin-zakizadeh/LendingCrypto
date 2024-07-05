import { LiFiModule } from '../../protocols/amm/lifi/LiFi.module';
import { SlippageEntry } from './SlippageEntry.entity';
import { SlippageService } from './slippage.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsModule } from '../../assets/assets.module';
import { EvmModule } from '../../evm/evm.module';
import { MarketsModule } from '../../lendingModule/markets.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([SlippageEntry]),
        MarketsModule,
        AssetsModule,
        EvmModule,
        LiFiModule
    ],

    exports: [SlippageService],
    providers: [SlippageService],
})
export class SlippageModule { }
