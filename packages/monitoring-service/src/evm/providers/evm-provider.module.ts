import { Module } from '@nestjs/common';
import { EvmProviderService } from './evm-provider.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [EvmProviderService],
  exports: [EvmProviderService],
})
export class EvmProviderModule { }

