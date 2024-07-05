import { Module } from '@nestjs/common';
import { AssetsModule } from '../../../assets/assets.module';
import { EvmModule } from '../../../evm/evm.module';
import { UniswapV2Service } from './uniswapv2.service';
import { UniswapV2Command } from './uniswapv2.command';

@Module({
  imports: [EvmModule, AssetsModule],
  providers: [UniswapV2Service, UniswapV2Command],
  exports: [UniswapV2Service],
})
export class UniswapV2Module { }
