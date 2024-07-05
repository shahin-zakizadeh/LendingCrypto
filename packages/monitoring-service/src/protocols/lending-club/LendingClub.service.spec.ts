import { Test, TestingModule } from '@nestjs/testing';
import { LendingClubService } from './LendingClubApi.service';
import { TestAppModule } from '../../utils/test-module/test-app.module';
import { TestAppService } from '../../utils/test-module/test-app.service';
import { parseEther } from 'ethers/lib/utils';
import { bnToDecimal } from '../../utils/precision-math';
import { assetFactory } from '../../utils/test-module/factories/assets';

describe('LendingClubApi', () => {
  let service: LendingClubService;
  let testService: TestAppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule.register({ useHardhat: true })],
      providers: [LendingClubService],
    }).useMocker((token) => {
      return {
        getAsset: jest.fn(() => assetFactory({ decimals: 18 }))
      }
    }).compile();

    service = module.get<LendingClubService>(LendingClubService);
    testService = module.get<TestAppService>(TestAppService);
    await testService.prepareTest();
    await testService.increaseTimeByOneDay();
  });

  afterEach(async () => {
    // Restore the blockchain state to the snapshot
    await testService?.tearDownTest();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('loadMarkets', () => {
    it('should return an array of markets', async () => {
      const markets = await service.loadMarkets();
      const wbtcMarketAddress = service.lcApi.markets
        .forNetwork(31337)
        .getContract('wBTC').address;
      const wbtcMarket = markets.find(
        (market) => market.address === wbtcMarketAddress,
      );

      expect(wbtcMarket).toBeTruthy;
    });
  });

  describe('queryMarket', () => {
    it('should return the correct parameters', async () => {
      const { market } = await testService.getHardhatContracts(service);
      const collateral = await market.collateralToken();
      const liqThreshold = await market.liquidationThreshold();
      const interestIndex = await market.interestIndex();
      const smallAccountThreshold = await market.smallAccountThreshold();
      const liquidationMaxHR = await market.liquidationMaxHR();
      const liquidationPenalty = await market.liquidationPenalty();
      const closingFee = await market.closingFee();
      const marketQuery = await service.queryMarketParameters(
        31337,
        market.address,
      );
      expect(marketQuery.collateralToken).toEqual(collateral);
      expect(marketQuery.liquidationThreshold).toEqual(liqThreshold);
      expect(marketQuery.interestIndex).toEqual(interestIndex);
      expect(marketQuery.smallAccountThreshold).toEqual(smallAccountThreshold);
      expect(marketQuery.liquidationMaxHR).toEqual(liquidationMaxHR);
      expect(marketQuery.liquidationPenalty).toEqual(liquidationPenalty);
      expect(marketQuery.closingFee).toEqual(closingFee);
    });
  });

  describe('queryAccounts', () => {
    // This test sets up 3 accounts with different collateral and principal amounts
    // and then queries them to check if the correct parameters are returned
    // To setup the accounts, we need to mint collateral tokens (wBTC), approve the market contract
    // to spend them, and then deposit them into the market contract
    // Afterwards we borrow the principal amount from the market contract
    // We then query the accounts and check if the correct parameters are returned
    it('should return the correct parameters', async () => {
      const { market, wBtcToken } = await testService.getHardhatContracts(service);

      const userAddress = '0x27Ca8e71026ea079Ba8a3EF5d6e51ac4b962c0A3';
      const signer = await testService.impersonateAccount(userAddress);
      await wBtcToken.connect(signer).mint(userAddress, parseEther('1000000'));
      await wBtcToken
        .connect(signer)
        .approve(market.address, parseEther('1000000'));

      // set up user's accounts state
      const nftIds = [0, 1]; // we'll create and query 2 accounts
      const collateral = parseEther('200');
      const principal = parseEther('500');
      const expectedRes = [];
      for (const nftId of nftIds) {
        // open account
        await market.connect(signer).openAccount();
        // deposit collateral tokens into the market contract
        await market.connect(signer).deposit(nftId, collateral);
        // borrow principal amount from the market contract
        await market.connect(signer).borrow(nftId, principal);

        expectedRes.push({
          nftId: nftId,
          collateralToken: collateral,
          principalAmount: principal,
          interestIndex: await market.getAccountInterestIndex(nftId),
        });
      }

      const queryRes = await service.queryAccounts(
        31337,
        market.address,
        nftIds,
      );

      expect(queryRes.length).toEqual(expectedRes.length);
      queryRes.forEach((res, i) => {
        const expectedResult = expectedRes[i];
        expect(res.nftId).toEqual(expectedResult.nftId);
        expect(res.collateralAmount).toEqual(
          bnToDecimal(expectedResult.collateralToken, 18),
        );
        expect(res.principalAmount).toEqual(
          bnToDecimal(expectedResult.principalAmount, 18),
        );
        expect(res.interestIndex).toEqual(
          bnToDecimal(expectedResult.interestIndex, 18),
        );
      });

      // clean up
      await testService.stopImpersonateAccount(userAddress);
    });
  });
  describe('queryOutdatedAccountsNftIds', () => {
    // TODO: check returned values for each account
    // Here we first create the initial state of the market for each test
    it('should test AccountCreated event', async () => {
      // get market contract instance
      const { market, wBtcToken } = await testService.getHardhatContracts(service);

      const userAddress = '0x27Ca8e71026ea079Ba8a3EF5d6e51ac4b962c0A3';
      const signer = await testService.impersonateAccount(userAddress);
      await wBtcToken.connect(signer).mint(userAddress, parseEther('1000000'));
      await wBtcToken
        .connect(signer)
        .approve(market.address, parseEther('1000000'));

      await testService.mineBlock();
      // get current block number
      const blockNumber = await testService.getBlockNumber();
      const accountIndex = (await market.totalAccountsCreated()).toNumber()
      // open account
      await market.connect(signer).openAccount();
      // mine a block to make sure the event is emitted
      await testService.mineBlock();
      // get current changes which must include the created account
      const { nftIds: currentChanges } =
        await service.queryOutdatedAccountsNftIds(
          31337,
          market.address,
          blockNumber,
        );
      expect(currentChanges).toEqual(new Set().add(accountIndex));
    });

    it('should test Transfer event', async () => {
      // Setup the initial state
      const { market, wBtcToken } = await testService.getHardhatContracts(service);
      const userAddress = '0x27Ca8e71026ea079Ba8a3EF5d6e51ac4b962c0A3';
      const signer = await testService.impersonateAccount(userAddress);
      await wBtcToken.connect(signer).mint(userAddress, parseEther('1000000'));
      await wBtcToken
        .connect(signer)
        .approve(market.address, parseEther('1000000'));
      const accountIndex = (await market.totalAccountsCreated()).toNumber()
      // open account
      await market.connect(signer).openAccount();
      // mine a block to make sure the event is emitted
      await testService.mineBlock();
      // get current block number
      const blockNumber = await testService.getBlockNumber();

      // Transfer the account from user address to another address
      const newAddress = '0x22B62245CdD641aF4C1A8719d2Fe3208B30D7A72';
      await market.connect(signer).transferFrom(userAddress, newAddress, 0);
      await testService.mineBlock();
      const { nftIds: currentChanges } =
        await service.queryOutdatedAccountsNftIds(
          31337,
          market.address,
          blockNumber,
        );
      expect(currentChanges).toEqual(new Set().add(accountIndex));
    });

    it('should test CollateralDeposited event', async () => {
      // Setup the initial state
      // get market contract instance
      const { market, wBtcToken } = await testService.getHardhatContracts(service);
      const userAddress = '0x27Ca8e71026ea079Ba8a3EF5d6e51ac4b962c0A3';
      const signer = await testService.impersonateAccount(userAddress);
      await wBtcToken.connect(signer).mint(userAddress, parseEther('1000000'));
      await wBtcToken
        .connect(signer)
        .approve(market.address, parseEther('1000000'));
      const accountIndex = (await market.totalAccountsCreated()).toNumber()
      await market.connect(signer).openAccount();
      await testService.mineBlock();
      const blockNumber = await testService.getBlockNumber();

      // set up user's accounts state
      const collateral = parseEther('500');
      // deposit collateral tokens into the market contract
      await market.connect(signer).deposit(0, collateral);
      await testService.mineBlock();
      const { nftIds: currentChanges } =
        await service.queryOutdatedAccountsNftIds(
          31337,
          market.address,
          blockNumber,
        );
      expect(currentChanges).toEqual(new Set().add(accountIndex));
    });

    it('should test CollateralWithdrew event', async () => {
      // Setup the initial state
      const { market, wBtcToken } = await testService.getHardhatContracts(service);
      const userAddress = '0x27Ca8e71026ea079Ba8a3EF5d6e51ac4b962c0A3';
      const signer = await testService.impersonateAccount(userAddress);
      await wBtcToken.connect(signer).mint(userAddress, parseEther('1000000'));
      await wBtcToken
        .connect(signer)
        .approve(market.address, parseEther('1000000'));
      const accountIndex = (await market.totalAccountsCreated()).toNumber()
      await market.connect(signer).openAccount();
      await testService.mineBlock();

      const collateral = parseEther('500');
      await market.connect(signer).deposit(0, collateral);
      await testService.mineBlock();

      // withdraw half the collateral tokens from the market contract
      await market.connect(signer).withdraw(0, collateral.div(2));
      const blockNumber = await testService.getBlockNumber();
      await testService.mineBlock();
      const { nftIds: currentChanges } =
        await service.queryOutdatedAccountsNftIds(
          31337,
          market.address,
          blockNumber,
        );
      expect(currentChanges).toEqual(new Set().add(accountIndex));
    });

    it('should test TokenBorrowed event', async () => {
      // Setup the initial state
      const { market, wBtcToken } = await testService.getHardhatContracts(service);
      const userAddress = '0x27Ca8e71026ea079Ba8a3EF5d6e51ac4b962c0A3';
      const signer = await testService.impersonateAccount(userAddress);
      await wBtcToken.connect(signer).mint(userAddress, parseEther('1000000'));
      await wBtcToken
        .connect(signer)
        .approve(market.address, parseEther('1000000'));
      const accountIndex = (await market.totalAccountsCreated()).toNumber()
      await market.connect(signer).openAccount();
      // set up user's accounts state
      const collateral = parseEther('500');
      // deposit collateral tokens into the market contract
      await market.connect(signer).deposit(0, collateral);
      await testService.mineBlock();
      const blockNumber = await testService.getBlockNumber();
      // borrow tokens from the market contract
      await market.connect(signer).borrow(0, parseEther('100'));
      await testService.mineBlock();
      const { nftIds: currentChanges } =
        await service.queryOutdatedAccountsNftIds(
          31337,
          market.address,
          blockNumber,
        );

      expect(currentChanges).toEqual(new Set().add(accountIndex));
    });

    it('should test TokenRepaid event', async () => {
      // Setup the initial state
      const { market, wBtcToken } = await testService.getHardhatContracts(service);
      const userAddress = '0x27Ca8e71026ea079Ba8a3EF5d6e51ac4b962c0A3';
      const signer = await testService.impersonateAccount(userAddress);
      await wBtcToken.connect(signer).mint(userAddress, parseEther('1000000'));
      await wBtcToken
        .connect(signer)
        .approve(market.address, parseEther('1000000'));
      const accountIndex = (await market.totalAccountsCreated()).toNumber()
      await market.connect(signer).openAccount();

      // deposit collateral tokens into the market contract
      const collateral = parseEther('500');
      await market.connect(signer).deposit(0, collateral);

      // borrow tokens from the market contract
      await market.connect(signer).borrow(0, parseEther('1000'));
      const mUsdToken = service.lcApi.peripherals
        .forNetwork(31337)
        .getContractInstance('mUSD');
      await mUsdToken
        .connect(signer)
        .approve(market.address, parseEther('1000'));

      await testService.mineBlock();
      // repay tokens to the market contract
      await market.connect(signer).repay(0, parseEther('500'));

      // check the event
      const blockNumber = await testService.getBlockNumber();
      await testService.mineBlock();
      const { nftIds: currentChanges } =
        await service.queryOutdatedAccountsNftIds(
          31337,
          market.address,
          blockNumber,
        );
      expect(currentChanges).toEqual(new Set().add(accountIndex));
    });

    it('should test AccountLiquidated event', async () => {
      // Setup the initial state
      const { market, wBtcToken, mUsdToken, priceProvider } =
        await testService.getHardhatContracts(service);

      // start impersonation
      const userAddress = '0x27Ca8e71026ea079Ba8a3EF5d6e51ac4b962c0A3';
      const signer = await testService.impersonateAccount(userAddress);
      // mint collateral token for the user address
      // and approve the market contract to use them
      await wBtcToken.connect(signer).mint(userAddress, parseEther('1000'));
      await wBtcToken
        .connect(signer)
        .approve(market.address, parseEther('1000'));
      // mint borrow token for the user address
      // since the user is going to liquidate himself
      // and approve the market contract to use them
      await mUsdToken.connect(signer).mint(userAddress, parseEther('100000'));
      await mUsdToken
        .connect(signer)
        .approve(market.address, parseEther('100000'));

      // open user's account
      const accountIndex = (await market.totalAccountsCreated()).toNumber()
      await market.connect(signer).openAccount();
      // deposit collateral tokens into the market contract
      const collateralDeposit = parseEther('30');
      await market.connect(signer).deposit(0, collateralDeposit);
      // get necessary data for calculating maximum borrow amount

      const initialCollateralPrice = 10000000000;
      await priceProvider
        .connect(signer)
        .setSafePrice(wBtcToken.address, initialCollateralPrice);

      const liquidationThreshold = await market.liquidationThreshold();
      const debtTokenBorrowedAmount = collateralDeposit
        .mul(initialCollateralPrice)
        .div(1e8) //Oracle has 8 decimals
        .mul(parseEther('1')) //liquidationThreshold has 18 decimals
        .div(liquidationThreshold);
      await priceProvider.connect(signer).setSafePrice(mUsdToken.address, 1e8);
      await market.connect(signer).borrow(0, debtTokenBorrowedAmount);

      // set the new price for the collateral token
      await priceProvider
        .connect(signer)
        .setSafePrice(wBtcToken.address, initialCollateralPrice - 1);
      const blockNumber = await testService.getBlockNumber();
      await testService.mineBlock();

      // liquidate the user's account
      await market.connect(signer).liquidate(0, debtTokenBorrowedAmount);
      await testService.mineBlock();
      const { nftIds: currentChanges } =
        await service.queryOutdatedAccountsNftIds(
          31337,
          market.address,
          blockNumber,
        );
      expect(currentChanges).toEqual(new Set().add(accountIndex));
    });

    it('should test deposit and withdraw for the same account', async () => {
      // Setup the initial state
      const { market, wBtcToken } = await testService.getHardhatContracts(service);
      const userAddress = '0x27Ca8e71026ea079Ba8a3EF5d6e51ac4b962c0A3';
      const signer = await testService.impersonateAccount(userAddress);
      await wBtcToken.connect(signer).mint(userAddress, parseEther('1000000'));
      await wBtcToken
        .connect(signer)
        .approve(market.address, parseEther('1000000'));
      const accountIndex = (await market.totalAccountsCreated()).toNumber();
      await market.connect(signer).openAccount();
      await testService.mineBlock();
      const blockNumber = await testService.getBlockNumber();

      // set up user's accounts state
      const collateral = parseEther('500');
      // deposit collateral tokens into the market contract
      await market.connect(signer).deposit(0, collateral);
      await testService.mineBlock();
      await market.connect(signer).withdraw(0, collateral.div(2));
      await testService.mineBlock();
      const { nftIds: currentChanges } =
        await service.queryOutdatedAccountsNftIds(
          31337,
          market.address,
          blockNumber,
        );
      console.log([...currentChanges]);
      expect(currentChanges).toEqual(new Set().add(accountIndex));
    });
  });
});
