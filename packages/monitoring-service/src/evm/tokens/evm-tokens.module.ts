import { Module } from '@nestjs/common';
import { EvmTokensService } from './evm-tokens.service';
import { AssetsModule } from '../../assets/assets.module';
import { ConfigModule } from '@nestjs/config';
import { EvmProviderModule } from '../providers/evm-provider.module';

@Module({
  imports: [AssetsModule, ConfigModule, EvmProviderModule],
  providers: [EvmTokensService],
  exports: [EvmTokensService],
})
export class EvmTokensModule { }
