import { Injectable } from '@nestjs/common';
import { Asset } from '../../../assets/entities/asset.entity';
import {
  AlphaRouter,
  parseAmount,
  SwapOptions,
} from '@uniswap/smart-order-router';
import { BigNumberish, ethers } from 'ethers';
import { Token, TradeType } from '@uniswap/sdk-core';
import { EvmProviderService } from '../../../evm/providers/evm-provider.service';

@Injectable()
export class Uniswapv3Service {
  constructor(private evmService: EvmProviderService) { }

  getProvider(chaindId: number) {
    return this.evmService.getProvider(
      chaindId,
    ) as ethers.providers.BaseProvider;
  }

  assetToToken(asset: Asset) {
    return new Token(
      asset.chainId,
      asset.address,
      asset.decimals,
      asset.symbol,
      asset.name,
    );
  }

  async getSwapRoute(
    amount: BigNumberish,
    asset0: Asset,
    asset1: Asset,
    type: TradeType,
    swapConfig: SwapOptions,
  ) {
    if (asset0.chainId != asset1.chainId) {
      throw new Error('Assets are not on the same network');
    }
    const chainId = asset0.chainId;
    const router = new AlphaRouter({
      chainId: chainId,
      provider: this.getProvider(chainId),
    });
    const input = parseAmount(amount.toString(), this.assetToToken(asset0));
    const quote = this.assetToToken(asset1);
    return await router.route(input, quote, type, swapConfig);
  }
}
