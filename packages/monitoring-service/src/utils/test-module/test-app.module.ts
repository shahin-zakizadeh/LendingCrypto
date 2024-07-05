import { CacheModule, DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestAppService } from './test-app.service';
import { entities } from '../../entities';
import { TestAppOptions, TEST_OPTIONS } from './test-options';
import { EvmProviderModule } from '../../evm/providers/evm-provider.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

/**
 * This module is to provide the basic modules for tests
 * Include the module in your Test.createTestingModule
 * 
 * TestAppModule.register({useDatabase: bool, useHardhat: bool})
 */
@Module({})
export class TestAppModule {

  static register(options: TestAppOptions): DynamicModule {
    const optionsProvider = {
      provide: TEST_OPTIONS,
      useValue: options,
    }
    const imports = [
      CacheModule.register({
        isGlobal: true,
        ttl: 180000,
      }),
      ConfigModule.forRoot(),
      EventEmitterModule.forRoot(),
      EvmProviderModule
    ]
    if (options.useDatabase) {
      imports.push(TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          type: 'postgres',
          host: config.get('DB_HOST'),
          port: config.get('DB_PORT'),
          username: config.get('DB_USER'),
          password: config.get('DB_PASSWORD'),
          database: "TestDB",
          synchronize: true,
          entities: entities,
          migrations: [],
          logging: false,
        }),
        inject: [ConfigService],
      }))
    } else {
      imports.push(TypeOrmModule.forRoot({
        type: 'better-sqlite3',
        database: "test-db.sql"
      }))
    }
    return {
      module: TestAppModule,
      imports,
      providers: [
        optionsProvider,
        TestAppService,
      ],
      exports: [optionsProvider, TestAppService, EvmProviderModule],
    }
  }
}
