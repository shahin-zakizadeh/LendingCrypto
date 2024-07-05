import { Module } from '@nestjs/common';
import { LiquidatorService } from './liquidator.service';
import { LendingClubModule } from '../protocols/lending-club/LendingClub.module';
import { EvmModule } from '../evm/evm.module';
import { AssetsModule } from '../assets/assets.module';
import { MarketsModule } from '../lendingModule/markets.module';

@Module({
    imports: [LendingClubModule, EvmModule, AssetsModule, MarketsModule],
    providers: [LiquidatorService],
    exports: [LiquidatorService],
})
export class LiquidatorModule {}
