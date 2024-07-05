import { ChainlinkPollingService } from '../chainlink-polling-service';
import { Network } from '@hovoh/evmcontractsregistry';
import { addresses } from '../../../evm/tokens/addresses';
import { DEFAULT_PRIORITY } from '../../../assets/price-monitor.service';
import {
  ChainlinkApi,
  ChainlinkNetworksContractMap,
} from '@hovoh/chainlink-api';

async function registerAssetOnFantomFeed(
  chainlink: ChainlinkPollingService,
  api: ChainlinkApi,
  feed: keyof ChainlinkNetworksContractMap[Network.OPERA_MAINNET],
  token?: string,
) {
  await chainlink.registerFeed(
    Network.OPERA_MAINNET,
    addresses[Network.OPERA_MAINNET][token ?? feed],
    api.forNetwork(Network.OPERA_MAINNET).getContract(feed).address,
    DEFAULT_PRIORITY,
    true,
  );
}

export async function registerFantomFeeds(
  chainlink: ChainlinkPollingService,
  api: ChainlinkApi,
) {
  await registerAssetOnFantomFeed(chainlink, api, 'AAVE');
  await registerAssetOnFantomFeed(chainlink, api, 'BTC', 'WBTC');
  await registerAssetOnFantomFeed(chainlink, api, 'USDC');
  await registerAssetOnFantomFeed(chainlink, api, 'BOO');
  await registerAssetOnFantomFeed(chainlink, api, 'USDT', 'fUSDT');
  await registerAssetOnFantomFeed(chainlink, api, 'DAI');
  await registerAssetOnFantomFeed(chainlink, api, 'LINK');
  await registerAssetOnFantomFeed(chainlink, api, 'ETH', 'WETH');
  await registerAssetOnFantomFeed(chainlink, api, 'sFTMx');
  await registerAssetOnFantomFeed(chainlink, api, 'FTM', 'WFTM');
  await registerAssetOnFantomFeed(chainlink, api, 'CRV');
  await registerAssetOnFantomFeed(chainlink, api, 'MIM');
}
