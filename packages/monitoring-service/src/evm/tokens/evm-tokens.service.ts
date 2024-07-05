import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Network,
  providers,
  ProvidersRegistry,
} from '@hovoh/evmcontractsregistry';
import {
  ERC20,
  initOpenZeppelinAPI,
  OpenZeppelinAPI,
} from '@hovoh/openzeppelin-api';
import { Asset } from '../../assets/entities/asset.entity';
import { AssetService } from '../../assets/asset.service';
import { EvmProviderService } from '../providers/evm-provider.service';

@Injectable()
export class EvmTokensService {
  ozApi: OpenZeppelinAPI;

  constructor(
    private assetService: AssetService,
    private evmProviders: EvmProviderService,
  ) {
    this.ozApi = initOpenZeppelinAPI(this.evmProviders.getProviders());
  }

  erc20(chainId: number, address: string) {
    return this.ozApi.forNetwork(chainId).getContractInstance('ERC20', address);
  }

  async registerAsset(
    chainId: number,
    address: string,
    type: string = 'ERC20',
  ) {
    let asset = await this.assetService.getAsset(address, chainId);
    if (asset) {
      return asset;
    }
    asset = new Asset();
    asset.address = address;
    asset.chainId = chainId;
    asset.type = type;
    const erc20 = this.erc20(chainId, address);
    const [decimals, symbol, name] = await this.evmProviders
      .multicall(chainId)
      .all([
        erc20.multiCall.decimals(),
        erc20.multiCall.symbol(),
        erc20.multiCall.name(),
      ]);
    asset.decimals = decimals;
    asset.symbol = symbol;
    asset.name = name;
    return this.assetService.registerAsset(asset);
  }
}
