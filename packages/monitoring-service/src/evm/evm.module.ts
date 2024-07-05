import { Module } from '@nestjs/common';
import { EvmProviderModule } from './providers/evm-provider.module';
import { EvmTokensModule } from './tokens/evm-tokens.module';

@Module({
  imports: [EvmProviderModule, EvmTokensModule],
  exports: [EvmProviderModule, EvmTokensModule],
})
export class EvmModule { }

