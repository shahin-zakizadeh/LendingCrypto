import { Injectable } from '@nestjs/common';
import {
  Network,
  providers,
  ProvidersRegistry,
} from '@hovoh/evmcontractsregistry';
import { Provider } from '@ethersproject/providers';
import { Wallet } from 'ethers';
import { IMulticallProvider } from '@hovoh/ethcall';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EvmProviderService {
  providers: ProvidersRegistry;
  ignoredNetworks: number[];
  privateKey: string;
  constructor(conf: ConfigService) {
    this.providers = providers;
    this.providers.addNetwork(Network.MAINNET, {
      httpRpc: [`https://mainnet.infura.io/v3/${conf.get('INFURA_KEY')}`],
      wsRpc: [],
    });
    this.providers.addNetwork(Network.LOCALHOST, {
      httpRpc: [`http://127.0.0.1:8545`],
      wsRpc: [],
    });
    this.providers.addNetwork(Network.OPERA_MAINNET, {
      httpRpc: ["https://rpc.ankr.com/fantom"],
      wsRpc: [],
    });
    this.ignoredNetworks = conf.get<string>('IGNORED_NETWORKS', "").split(",").map(parseInt)
    this.privateKey = conf.get('SIGNER_PRIVATE_KEY')
  }

  getProviders() {
    return providers;
  }

  setProvider(chainId: number, url: string) {
    this.providers.addNetwork(chainId, {
      httpRpc: [url],
      wsRpc: [],
    });
  }

  getProvider(chainId: number): Provider | Wallet {
    return providers.forNetwork(chainId);
  }

  multicall(chainId: number): IMulticallProvider {
    return this.getProviders().multicallForNetwork(chainId);
  }

  getBlockNumber(chainId: number): Promise<number> {
    return (this.providers.forNetwork(chainId) as Provider).getBlockNumber()
  }

  getWallet(chainId: number): Wallet {
    return new Wallet(this.privateKey).connect(this.getProvider(chainId) as Provider);
  }
}
