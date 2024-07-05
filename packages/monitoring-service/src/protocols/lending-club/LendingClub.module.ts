import { Module } from '@nestjs/common';
import { LendingClubService } from './LendingClubApi.service';
import { MarketsModule } from '../../lendingModule/markets.module';
import { LendingClubSyncService } from './sync/LendingClubSync.service';
import { AssetsModule } from '../../assets/assets.module';
import { EvmModule } from '../../evm/evm.module';

@Module({
  imports: [EvmModule, AssetsModule, MarketsModule],
  providers: [LendingClubService, LendingClubSyncService],
  exports: [LendingClubService, LendingClubSyncService],
})
export class LendingClubModule {}
