import { MetricTrackingModule } from './MetricTracking/metric-tracking.module';
import { Module, CacheModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsModule } from './assets/assets.module';
import { EvmModule } from './evm/evm.module';
import { ScheduleModule } from '@nestjs/schedule';
import { migrations } from '../migrations';
import { MarketsModule } from './lendingModule/markets.module';
import { entities } from './entities';
import { DiscordModule } from './discord/discord.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProtocolsModule } from './protocols/protocols.module';
import { LiquidatorModule } from './liquidator/liquidator.module';
import { LendingClubModule } from './protocols/lending-club/LendingClub.module';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 180000,
    }),
    ConfigModule.forRoot({isGlobal: true}),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get('DB_PORT'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        synchronize: false,
        entities: entities,
        migrations: migrations,
        migrationsRun: true,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    AssetsModule,
    EvmModule,
    MarketsModule,
    DiscordModule,
    NotificationsModule,
    ProtocolsModule,
    MetricTrackingModule,
    LendingClubModule,
    LiquidatorModule
  ],
  providers: [],
})
export class AppModule { }
