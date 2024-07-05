import {
  initLendingClubApi,
  LendingClubApi,
  networkEnabled,
  lcNetwork,
} from '@mclb/lending-api';
import { Injectable, Logger } from '@nestjs/common';
import { BigNumber, providers } from 'ethers';
import { Asset } from '../../assets/entities/asset.entity';
import { Market } from '../../lendingModule/entities/market.entity';
import { EvmProviderService } from '../../evm/providers/evm-provider.service';
import { bnToDecimal } from '../../utils/precision-math';
import { Account } from '../../lendingModule/entities/account.entity';
import { AssetService } from '../../assets/asset.service';
import { MaxAttemptsError, Retryable } from 'typescript-retry-decorator';
import { mergeFilters } from '../../utils/mergeFilters';

interface QueryMarketResult {
  collateralToken: string;
  principalToken: string;
  liquidationThreshold: BigNumber;
  interestIndex: BigNumber;
  smallAccountThreshold: BigNumber;
  liquidationMaxHR: BigNumber;
  liquidationPenalty: BigNumber;
  closingFee: BigNumber;
}

@Injectable()
export class LendingClubService {
  private readonly logger = new Logger(LendingClubService.name);
  public lcApi: LendingClubApi;
  public enabledNetwork;

  constructor(private evmProviders: EvmProviderService, private assets: AssetService) {
    this.lcApi = initLendingClubApi(evmProviders.getProviders());
    this.enabledNetwork = networkEnabled.filter(network => !evmProviders.ignoredNetworks.includes(network));
  }

  /**
   * loads all markets from the all blockchains
   * @returns an array of objects containing the necessary information to create a market in database
   */
  async loadMarkets(): Promise<Market[]> {
    const markets: Market[] = [];
    for (const chainId of this.enabledNetwork) {
      const contractNames = this.lcApi.markets.forNetwork(chainId).contractNames as string[];
      for (const marketName of contractNames) {
        // For each market, we require the following information:
        // address, chainId, liquidationThreshold, owner, collateralAsset, debtAsset, collateralAssetId, debtAssetId
        try {
          const market = await this.loadMarket(marketName, chainId)
          markets.push(market);
        } catch (error) {
          this.logger.error(`Could not load market ${marketName} on ${chainId}`, error)
        }
      }
    }
    return markets;
  }

  @Retryable({
    maxAttempts: 3,
    backOff: 1000,
  })
  async loadMarket(marketName: string, chainId: number) {
    const marketContract = this.lcApi.markets
      .forNetwork(lcNetwork(chainId))
      .getContractInstance(marketName as "market");
    const {
      collateralToken,
      principalToken,
      interestIndex,
      liquidationThreshold,
      smallAccountThreshold,
      liquidationMaxHR,
      liquidationPenalty,
      closingFee,
    } = await this.queryMarketParameters(chainId, marketContract.address);

    const collateralAsset = new Asset();
    collateralAsset.address = collateralToken;
    collateralAsset.chainId = chainId;
    collateralAsset.type = 'ERC20';
    const principalAsset = new Asset();
    principalAsset.address = principalToken;
    principalAsset.chainId = chainId;
    principalAsset.type = 'ERC20';
    const market = new Market();
    market.address = marketContract.address;
    market.chainId = chainId;
    market.collateralAsset = Promise.resolve(collateralAsset);
    market.principalAsset = Promise.resolve(principalAsset);
    market.interestIndex = bnToDecimal(interestIndex, 18);
    market.liquidationThreshold = bnToDecimal(liquidationThreshold, 18);
    market.smallAccountThreshold = bnToDecimal(smallAccountThreshold, 0);
    market.liquidationMaxHR = bnToDecimal(liquidationMaxHR, 18);
    market.liquidationPenalty = bnToDecimal(liquidationPenalty, 3);
    market.closingFee = bnToDecimal(closingFee, 18);
    market.lastSync = this.lcApi.markets
      .forNetwork(lcNetwork(chainId))
      .getContract(marketName as "market").deployedAt;
    return market;
  }

  /**
   * Gets a market's chainId and address and returns the following parameters
   * principalAmount, collateralToken, liquidationThreshold, interestIndex
   * @param chainId - the chainId of the queried market
   * @param marketAddress - the address of the queried market
   * @returns an object containing collateralToken, liquidationThreshold, interestIndex
   * @dev We need to replace 31337 with chainId
   */
  async queryMarketParameters(
    chainId: number,
    marketAddress: string,
  ): Promise<QueryMarketResult> {
    const market = this.lcApi.peripherals
      .forNetwork(lcNetwork(chainId))
      .getContractInstance('market', marketAddress);
    const [
      collateralToken,
      principalToken,
      liquidationThreshold,
      interestIndex,
      smallAccountThreshold,
      liquidationMaxHR,
      liquidationPenalty,
      closingFee,
    ] = await this.lcApi.peripherals
      .forNetwork(lcNetwork(chainId))
      .multiCall(() => [
        market.multiCall.collateralToken(),
        market.multiCall.debtToken(),
        market.multiCall.liquidationThreshold(),
        market.multiCall.interestIndex(),
        market.multiCall.smallAccountThreshold(),
        market.multiCall.liquidationMaxHR(),
        market.multiCall.liquidationPenalty(),
        market.multiCall.closingFee(),
      ]);
    return {
      collateralToken,
      principalToken,
      liquidationThreshold,
      interestIndex,
      smallAccountThreshold,
      liquidationMaxHR,
      liquidationPenalty,
      closingFee,
    };
  }

  async queryAssetsPrices(chainId: number, marketAddress: string) {
    const market = this.lcApi.peripherals
      .forNetwork(lcNetwork(chainId))
      .getContractInstance('market', marketAddress);
    const [getCollateralPrice, getDebtPrice] = await this.lcApi.peripherals
      .forNetwork(lcNetwork(chainId))
      .multiCall(() => [
        market.multiCall.getCollateralPrice(),
        market.multiCall.getDebtPrice(),
      ]);
    return {
      collateralPrice: getCollateralPrice,
      debtPrice: getDebtPrice,
    };
  }

  /**
   * Gets a list of accounts and returns the following parameters
   * principalAmount, collateralToken, accountInterestIndex
   * @param chainId - the chainId of the queried market
   * @param marketAddress - the address of the queried market
   * @param nftIds - the list of accounts' nftIds to be queried
   * @returns an array of objects containig account, collateralToken, principalAmount, accountInterestIndex
   */
  async queryAccounts(
    chainId: number,
    marketAddress: string,
    nftIds: number[],
  ): Promise<Account[]> {
    const accounts: Account[] = [];
    const market = this.lcApi.peripherals
      .forNetwork(lcNetwork(chainId))
      .getContractInstance('market', marketAddress);
    for (const nftId of nftIds) {
      const [collateralAmount, principalAmount, interestIndex, collateralAddress, principalAddress, owner] =
        await this.lcApi.peripherals
          .forNetwork(lcNetwork(chainId))
          .multiCall(() => [
            market.multiCall.collateralAmount(nftId),
            market.multiCall.principalAmount(nftId),
            market.multiCall.getAccountInterestIndex(nftId),
            market.multiCall.collateralToken(),
            market.multiCall.debtToken(),
            market.multiCall.ownerOf(nftId)
          ]);

      const account = new Account();
      account.nftId = nftId;
      account.owner = owner;

      const collateral = await this.assets.getAsset(collateralAddress, chainId);
      account.collateralAmount = bnToDecimal(collateralAmount, collateral.decimals);

      const principal = await this.assets.getAsset(principalAddress, chainId);
      account.principalAmount = bnToDecimal(principalAmount, principal.decimals);
      account.interestIndex = bnToDecimal(interestIndex, 18);
      const accountMarket = new Market();
      accountMarket.address = marketAddress;
      accountMarket.chainId = chainId;
      account.market = Promise.resolve(accountMarket);
      accounts.push(account);
    }
    return accounts;
  }

  async getOutdatedAccountNftIds(
    chainId: number,
    marketAddress: string,
    sinceBlock: number,
  ): Promise<{ lastSync: number; nftIds: Set<number> }> {
    try {
      return await this.queryOutdatedAccountsNftIds(chainId, marketAddress, sinceBlock);
    } catch (error) {
      const blockNumber = await this.evmProviders.getBlockNumber(chainId);
      this.logger.log("Event Query too wide, reducing block range")
      let pageSize = Math.ceil((blockNumber - sinceBlock) / 2);
      let from = sinceBlock;
      let accounts = new Set<number>();
      let latestEvent = sinceBlock;
      while (from < blockNumber) {
        try {
          let to = from + pageSize
          const { lastSync, nftIds } = await this.queryOutdatedAccountsNftIds(chainId, marketAddress, from, to);
          latestEvent = lastSync;
          nftIds.forEach(id => accounts.add(id));
          from = to;
        } catch (error) {
          if (error instanceof MaxAttemptsError) {
            throw error;
          }
          pageSize = Math.ceil(pageSize / 2);
          if (pageSize < 2) {
            throw new Error("Page size of 1, something is wrong");
          }
        }
      }
      return { lastSync: latestEvent, nftIds: accounts }
    }
  }

  /**
   * Gets a market's chainId and address and returns the list of outdated accounts
   * @dev It creates a filter based on the events that can change the state of the vault
   * @param chaindId - the chainId of the queried market
   * @param marketAddress - the address of the queried market
   * @param sinceBlock - the block number to start the query from
   * @returns a set filled with the nftIds of outdated accounts
   * @dev We need to replace 31337 with chainId
   */
  @Retryable({
    maxAttempts: 3,
    backOff: 1000,
    doRetry: (err) => !Boolean(err.body?.includes("block range is too wide")),
  })
  async queryOutdatedAccountsNftIds(
    chaindId: number,
    marketAddress: string,
    sinceBlock: number,
    toBlock: string | number = "latest"
  ): Promise<{ lastSync: number; nftIds: Set<number> }> {
    let lastSync = sinceBlock;
    const market = this.lcApi.peripherals
      .forNetwork(lcNetwork(chaindId))
      .getContractInstance('market', marketAddress);
    const outdatedAccounts = new Set<number>();
    // TODO: merge filters to query all events in one RPC call
    // Transfer event is dealt with later in this function
    const filterList = [
      'AccountCreated(uint256,address)',
      'CollateralDeposited(uint256,uint256)',
      'CollateralWithdrawn(uint256,uint256)',
      'TokenBorrowed(uint256,uint256)',
      'TokenRepaid(uint256,uint256,uint256)',
      'AccountLiquidated(uint256,address,address,uint256,uint256,uint256)',
    ] as const;
    const filters = filterList.map((filter) => market.filters[filter]());

    for (const filter of filters) {
      const events = await market.queryFilter(filter, sinceBlock, toBlock);
      for (const event of events) {
        // sets only consider javascript primitive types
        // so we need to convert big numbers into strings to avoid duplicates
        outdatedAccounts.add(event.args[0].toNumber());
        if (event.blockNumber > lastSync) {
          lastSync = event.blockNumber;
        }
      }
    }

    // A seperation is needed for the Transfer event
    // because it's args[0] is the sender not the affected account
    const transferFilter = market.filters.Transfer();
    const transferEvents = await market.queryFilter(transferFilter, sinceBlock, toBlock);
    for (const event of transferEvents) {
      outdatedAccounts.add(event.args[2].toNumber());
      if (event.blockNumber > lastSync) {
        lastSync = event.blockNumber;
      }
    }
    return { lastSync, nftIds: outdatedAccounts };
  }
}
