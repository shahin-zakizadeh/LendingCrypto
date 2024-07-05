import { Network } from '@hovoh/evmcontractsregistry';
import { providers } from 'ethers';
import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TestAppOptions, TEST_OPTIONS } from './test-options';
import { EvmProviderService } from '../../evm/providers/evm-provider.service';
import { isAddress, parseEther } from 'ethers/lib/utils';
import { LendingClubService } from 'src/protocols/lending-club/LendingClubApi.service';

@Injectable()
export class TestAppService {
  private snapshotId: string | null;

  constructor(
    @Inject(TEST_OPTIONS) private testOptions: TestAppOptions,
    private evmService: EvmProviderService,
    private dataSource: DataSource,
  ) { }

  async prepareTest() {
    if (this.testOptions.useDatabase) {
      await this.setUpDatabase();
    }
    if (this.testOptions.useHardhat) {
      await this.snapshotHardhat();
    }
  }

  async tearDownTest() {
    if (this.testOptions.useHardhat) {
      await this.restoreSnapshot();
    }
    if (this.testOptions.useDatabase) {
      await this.closeDatabaseConnection();
    }
  }

  provider() {
    if (this.testOptions.chainId) {
      return this.evmService.getProvider(
        this.testOptions.chainId,
      ) as providers.JsonRpcProvider;
    }
    return this.evmService.getProvider(
      Network.LOCALHOST,
    ) as providers.JsonRpcProvider;
  }

  async snapshotHardhat() {
    const provider = this.provider();
    this.snapshotId = await provider.send('evm_snapshot', []);
  }

  async restoreSnapshot() {
    const provider = this.provider();
    this.snapshotId = await provider.send('evm_revert', [this.snapshotId]);
    this.snapshotId = null;
  }

  async increaseTimeByOneDay() {
    const provider = this.provider();
    await provider.send('evm_increaseTime', [96400]);
  }

  async impersonateAccount(address: string): Promise<providers.JsonRpcSigner> {
    if (!isAddress(address))
      throw new Error(`${address} is not a valid ethereum address`);

    const provider = this.provider();
    await provider.send('hardhat_impersonateAccount', [address]);
    // this is necessary because hex quantities with leading zeros are not valid at the JSON-RPC layer
    const newBalance = parseEther('100').toHexString().replace('0x0', '0x');
    await provider.send('hardhat_setBalance', [address, newBalance]);
    return provider.getSigner(address);
  }

  async stopImpersonateAccount(address: string) {
    if (!isAddress(address))
      throw new Error(`${address} is not a valid ethereum address`);
    const provider = this.provider();
    await provider.send('hardhat_stopImpersonatingAccount', [address]);
  }

  async getBlockNumber(): Promise<number> {
    const provider = this.provider();;
    return provider.getBlockNumber();
  }

  async mineBlock() {
    const provider = this.provider();;
    await provider.send('evm_mine', []);
  }

  async getHardhatContracts(service: LendingClubService) {
    // Setup the initial state
    // get market contract instance
    const chainId = 31337;
    const market = service.lcApi.markets
      .forNetwork(chainId)
      .getContractInstance('wBTC');
    // get wBTC token contract instance
    const wBtcToken = service.lcApi.peripherals
      .forNetwork(chainId)
      .getContractInstance('WBTC');
    // get mUSD token contract instance
    const mUsdToken = service.lcApi.peripherals
      .forNetwork(chainId)
      .getContractInstance('mUSD');
    // get price provider contract instance
    const priceProvider = service.lcApi.peripherals
      .forNetwork(chainId)
      .getContractInstance('priceProvider');
    return { market, wBtcToken, mUsdToken, priceProvider };
  }

  async setUpDatabase() {
    await this.migrate();
    await this.cleanDatabase();
  }

  async closeDatabaseConnection() {
    await this.dataSource.destroy();
  }

  async migrate() {
    await this.dataSource.runMigrations();
  }

  public async cleanDatabase(): Promise<void> {
    try {
      const entities = this.dataSource.entityMetadatas;
      const tableNames = entities
        .map((entity) => `"${entity.tableName}"`)
        .join(', ');

      await this.dataSource.query(`TRUNCATE ${tableNames} CASCADE;`);
    } catch (error) {
      throw new Error(`ERROR: Cleaning test database: ${error}`);
    }
  }
}
