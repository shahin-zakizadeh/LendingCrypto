import { CommandFactory } from 'nest-commander';
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from './entities';
import { migrations } from '../migrations';
import { ChainlinkModule } from './protocols/chainlink/chainlink.module';
import { Seed } from './utils/seed.commander';
import { AssetsModule } from './assets/assets.module';
import { MarketsModule } from './lendingModule/markets.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
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
    TypeOrmModule.forFeature(entities),
    AssetsModule,
    MarketsModule,
    ChainlinkModule,
  ],
  providers: [
    Seed
  ]
})
export class CliModule { }

async function bootstrap() {
  await CommandFactory.run(CliModule, ['warn', 'error']);
}

bootstrap();
