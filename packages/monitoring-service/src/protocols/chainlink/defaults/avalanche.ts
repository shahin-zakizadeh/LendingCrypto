import { ChainlinkPollingService } from '../chainlink-polling-service';
import { Network } from '@hovoh/evmcontractsregistry';
import { addresses } from '../../../evm/tokens/addresses';
import { DEFAULT_PRIORITY } from '../../../assets/price-monitor.service';
import { ChainlinkApi } from '@hovoh/chainlink-api';

export async function registerAvalancheFeeds(
  chainlinkPolling: ChainlinkPollingService,
  api: ChainlinkApi,
) {
  await chainlinkPolling.registerFeed(
    Network.AVALANCHE_MAINNET,
    addresses[Network.AVALANCHE_MAINNET].WAVAX,
    api.forNetwork(Network.AVALANCHE_MAINNET).getContract('AVAX').address,
    DEFAULT_PRIORITY,
    true,
  );
  await chainlinkPolling.registerFeed(
    Network.AVALANCHE_MAINNET,
    addresses[Network.AVALANCHE_MAINNET].WBTC,
    api.forNetwork(Network.AVALANCHE_MAINNET).getContract('BTC').address,
    DEFAULT_PRIORITY,
    true,
  );
  await chainlinkPolling.registerFeed(
    Network.AVALANCHE_MAINNET,
    addresses[Network.AVALANCHE_MAINNET].WETH,
    api.forNetwork(Network.AVALANCHE_MAINNET).getContract('ETH').address,
    DEFAULT_PRIORITY,
    true,
  );
}
