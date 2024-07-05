import { CacheModule, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { QueueLiquidationPublisher } from './publishers/queued-liquidation.publisher';
import { LiquidationPublisher } from './publishers/liquidation.publisher';
import { LiquidationResultPublisher } from './publishers/liquidation-result.publisher';

@Module({
  imports: [CacheModule.register()],
  providers: [
    NotificationsService,
    QueueLiquidationPublisher,
    LiquidationPublisher,
    LiquidationResultPublisher
  ],
})
export class NotificationsModule { }
