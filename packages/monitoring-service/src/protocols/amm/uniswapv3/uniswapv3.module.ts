import { AssetsModule } from '../../../assets/assets.module';
import { EvmModule } from '../../../evm/evm.module';
import { Module } from '@nestjs/common';
import { Uniswapv3Service } from './uniswapv3.service';

@Module({
  imports: [EvmModule, AssetsModule],
  providers: [Uniswapv3Service],
  exports: [Uniswapv3Service]
})
export class UniswapV3Module { }
