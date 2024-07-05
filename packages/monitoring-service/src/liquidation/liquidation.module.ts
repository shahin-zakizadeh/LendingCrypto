import { Module } from '@nestjs/common';
import { LiquidationService } from './liquidation.service';
import { HealthRatioWatchdogService } from './hr-watchdog.service';
import { MarketsModule } from '../lendingModule/markets.module';
import { LendingClubModule } from '../protocols/lending-club/LendingClub.module';

@Module({
  imports: [MarketsModule, LendingClubModule],
  providers: [LiquidationService, HealthRatioWatchdogService]
})
export class LiquidationModule { }
