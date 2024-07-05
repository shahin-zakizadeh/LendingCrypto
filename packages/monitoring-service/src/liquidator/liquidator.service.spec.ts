import { Test, TestingModule } from '@nestjs/testing';
import { LiquidatorService } from './liquidator.service';
import Decimal from 'decimal.js';
import { LendingClubService } from '../protocols/lending-club/LendingClubApi.service';
import { EvmModule } from '../evm/evm.module';
import { EvmProviderService } from '../evm/providers/evm-provider.service';
import { TestAppService } from '../utils/test-module/test-app.service';
import { TestAppModule } from '../utils/test-module/test-app.module';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BigNumber, ethers, utils } from 'ethers';
import { assetFactory } from '../utils/test-module/factories/assets';
import { marketFactory } from '../utils/test-module/factories/market';
import { accountFactory } from '../utils/test-module/factories/account';
import { LiquidationResult } from '../liquidation/events/liquidation-result.event';
import { liquidateEventFactory } from '../utils/test-module/factories/liquidateEvent';
import { parseEther, parseUnits } from 'ethers/lib/utils';
import {
  LendingClubApi,
  MockAggregatorV3__factory,
  MockToken__factory,
  SimpleLiquidator__factory,
  getExport,
  initLendingClubApi,
} from '@mclb/lending-api';
import { AggregatorV3Interface__factory } from '@hovoh/chainlink-api';
import { bnToDecimal } from '../utils/precision-math';
jest.setTimeout(1000000);

interface IEnvioronmentParameters {
  liquidationThreshold: Decimal;
  liquidationMaxHR: Decimal;
  liquidationPenalty: Decimal;
  chainId?: number;
  collateralAmount: Decimal;
  principalAmount: Decimal;
  collateralPrice: Decimal;
  principalPrice: Decimal;
}
const liquidatableEnvironmentParameters = async () => {
  const envParams: IEnvioronmentParameters = {
    liquidationThreshold: new Decimal(1.5),
    liquidationMaxHR: new Decimal(2),
    liquidationPenalty: new Decimal(1.1),
    chainId: 250,
    collateralAmount: new Decimal(1500),
    principalAmount: new Decimal(1100),
    collateralPrice: new Decimal(3),
    principalPrice: new Decimal(2.8),
  };
  return setupTestEnvironmentParameters(envParams);
};

const nonLiquidatableEnvironmentParameters = async () => {
  const envParams: IEnvioronmentParameters = {
    liquidationThreshold: new Decimal(1.5),
    liquidationMaxHR: new Decimal(2),
    liquidationPenalty: new Decimal(1.1),
    chainId: 250,
    collateralAmount: new Decimal(1500),
    principalAmount: new Decimal(1100),
    collateralPrice: new Decimal(2),
    principalPrice: new Decimal(1),
  };
  return setupTestEnvironmentParameters(envParams);
};

const setupTestEnvironmentParameters = async (
  envParams: IEnvioronmentParameters,
) => {
  const liquidationThreshold = envParams.liquidationThreshold;
  const liquidationMaxHR = envParams.liquidationMaxHR;
  const liquidationPenalty = envParams.liquidationPenalty;
  let principal = assetFactory({ chaindId: envParams?.chainId });
  let collateral = assetFactory({
    chaindId: envParams?.chainId ?? principal.chainId,
  });
  let market = marketFactory(principal, collateral, {
    liquidationThreshold,
    liquidationMaxHR,
    liquidationPenalty,
  });
  market.principalAsset = Promise.resolve(principal);
  market.collateralAsset = Promise.resolve(collateral);
  const collateralAmount = envParams.collateralAmount;
  const principalAmount = envParams.principalAmount;
  let account = accountFactory(market, { collateralAmount, principalAmount });
  const marketAddress = '0x321162Cd933E2Be498Cd2267a90534A804051b11';
  market.address = marketAddress;
  (await account.market).address = marketAddress;
  const collateralPrice = envParams.collateralPrice;
  const debtPrice = envParams.principalPrice;

  const liquidateParams = liquidateEventFactory(
    account,
    market,
    principal,
    principal,
  );

  return {
    liquidateParams,
    collateralPrice,
    debtPrice,
  };
};

describe('testing liquidator service reliant on local environment', () => {
  let service: LiquidatorService;
  let evmService: EvmProviderService;
  let testService: TestAppService;
  let lcService: LendingClubService;
  let queryAccountsMock = jest.fn();
  let queryAssetsPricesMock = jest.fn();
  const chainId = 250;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, EvmModule, TestAppModule.register({ chainId })],
      providers: [
        ConfigService,
        LiquidatorService,
        EvmProviderService,
        EventEmitter2,
      ],
    })
      .useMocker((token) => {
        if (token == LendingClubService) {
          return {
            queryAccounts: queryAccountsMock,
            queryAssetsPrices: queryAssetsPricesMock,
          };
        }
      })
      .compile();

    evmService = module.get<EvmProviderService>(EvmProviderService);
    evmService.setProvider(chainId, 'http://localhost:8545');
    testService = module.get<TestAppService>(TestAppService);
    lcService = module.get<LendingClubService>(LendingClubService);
    service = module.get<LiquidatorService>(LiquidatorService);
    await testService.prepareTest();
  });

  afterEach(async () => {
    await testService?.tearDownTest();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should getRouterAddress', async () => {
    const routerAddress = service.routerAddress();
    const EQ_ROUTER = '0x1A05EB736873485655F29a37DEf8a0AA87F5a447';
    expect(routerAddress).toEqual(EQ_ROUTER);
  });

  it('should get route', async () => {
    const route = service.route();
    expect(route).toBeDefined();
  });

  it('should get the swap data', async () => {
    const swapData = utils.defaultAbiCoder.encode(
      ['address', 'tuple(address from, address to, bool stable)[]'],

      [service.routerAddress(), service.route()],
    );
    const serviceSwapData = service.swapData();
    expect(serviceSwapData).toEqual(swapData);
  });

  it('should calculate the amount to liquidate with correct Decimals', async () => {
    const { liquidateParams, collateralPrice, debtPrice } =
      await liquidatableEnvironmentParameters();
    queryAccountsMock.mockReturnValue([liquidateParams.account]);
    queryAssetsPricesMock.mockReturnValue({
      collateralPrice,
      debtPrice,
    });
    const amountToLiquidateWithDecimals =
      await service.amountToLiquidateWithDecimals(liquidateParams);
    expect(amountToLiquidateWithDecimals._hex).toBe(
      parseUnits(
        (await service.amountToLiquidate(liquidateParams.account)).toString(),
        18,
      )._hex,
    );
  });

  it('should calculate the amount to Borrow with correct Decimals', async () => {
    const { liquidateParams, collateralPrice, debtPrice } =
      await liquidatableEnvironmentParameters();
    queryAccountsMock.mockReturnValue([liquidateParams.account]);
    queryAssetsPricesMock.mockReturnValue({
      collateralPrice,
      debtPrice,
    });
    const amountToBorrowWithDecimals: BigNumber =
      await service.amountToBorrowWithDecimals(liquidateParams, 0);
    expect(amountToBorrowWithDecimals._hex).toBe(
      parseUnits((await service.amountToBorrow(liquidateParams, 0)).toString(), 18)
        ._hex,
    );
  });

  it('should calculate the amount to Borrow from the LP', async () => {
    const { liquidateParams, collateralPrice, debtPrice } =
      await liquidatableEnvironmentParameters();
    queryAccountsMock.mockReturnValue([liquidateParams.account]);
    queryAssetsPricesMock.mockReturnValue({
      collateralPrice,
      debtPrice,
    });
    const amountToBorrow = await service.amountToBorrow(liquidateParams, 0);
    const amountToLiquidate = await service.amountToLiquidate(
      liquidateParams.account,
    );
    expect(amountToBorrow).toEqual(
      amountToLiquidate
        .mul(liquidateParams.market.liquidationPenalty)
        .toNumber(),
    );
  });

  it('should emit the liquidation result event with failed status', async () => {
    const { liquidateParams, collateralPrice, debtPrice } =
      await nonLiquidatableEnvironmentParameters();
    queryAccountsMock.mockReturnValue([liquidateParams.account]);
    queryAssetsPricesMock.mockReturnValue({
      collateralPrice,
      debtPrice,
    });
    // @ts-ignore
    const emitSpy = jest.spyOn(service.eventEmitter, 'emit');
    // @ts-ignore
    service.failedLiquidation(liquidateParams);
    expect(emitSpy).toHaveBeenCalledWith(
      LiquidationResult.NAME,
      expect.objectContaining({
        account: liquidateParams.account,
        success: false,
        profit: 0,
        txId: '',
      }),
    );
  });

  it('should return the account is liquidatable', async () => {
    const { liquidateParams, collateralPrice, debtPrice } =
      await liquidatableEnvironmentParameters();
    queryAccountsMock.mockReturnValue([liquidateParams.account]);
    queryAssetsPricesMock.mockReturnValue({
      collateralPrice,
      debtPrice,
    });
    const isLiquidatable = await service.isLiquidatable(liquidateParams);
    expect(isLiquidatable).toBeTruthy();
  });

  it('should return the account is not liquidatable', async () => {
    const { liquidateParams, collateralPrice, debtPrice } =
      await nonLiquidatableEnvironmentParameters();
    queryAccountsMock.mockReturnValue([liquidateParams.account]);
    queryAssetsPricesMock.mockReturnValue({
      collateralPrice,
      debtPrice,
    });
    const isLiquidatable = await service.isLiquidatable(liquidateParams);
    expect(isLiquidatable).toBeFalsy();
  });

  it('should not try to liquidate the account', async () => {
    // @ts-ignore
    const failedLiquidationSpy = jest.spyOn(service, 'failedLiquidation');
    // @ts-ignore
    const eventEmitterSpy = jest.spyOn(service.eventEmitter, 'emit');
    const { liquidateParams, collateralPrice, debtPrice } =
      await nonLiquidatableEnvironmentParameters();
    queryAccountsMock.mockReturnValue([liquidateParams.account]);
    queryAssetsPricesMock.mockReturnValue({
      collateralPrice,
      debtPrice,
    });

    await service.tryToLiquidate(liquidateParams);
    expect(failedLiquidationSpy).toBeCalledWith(liquidateParams);
    expect(eventEmitterSpy).toBeCalledWith(
      LiquidationResult.NAME,
      expect.objectContaining({
        account: liquidateParams.account,
        success: false,
        profit: 0,
        txId: '',
      }),
    );
  });
});

describe('testing liquidator service reliant on the blockchain', () => {
  let service: LiquidatorService;
  let evmService: EvmProviderService;
  let testService: TestAppService;
  let lcService: LendingClubService;
  let queryAccountsMock = jest.fn();
  let queryAssetsPricesMock = jest.fn();
  const chainId = 250;
  const EQ_FTM_USDC_LIQ_DID = 'eq_ftm_usdc_liqu';
  const USDC = '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75';
  const WFTM = '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83';
  const FAKE_ORACLE_DID = 'fake_oracle';
  const CL_FTM_FEED = '0xf4766552D15AE4d256Ad41B6cf2933482B0680dc';

  beforeEach(async () => {
    jest.setTimeout(1000000);
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, EvmModule, TestAppModule.register({ chainId })],
      providers: [
        ConfigService,
        LiquidatorService,
        EvmProviderService,
        EventEmitter2,
        LendingClubService,
      ],
    }).compile();

    service = module.get<LiquidatorService>(LiquidatorService);
    evmService = module.get<EvmProviderService>(EvmProviderService);
    evmService.setProvider(chainId, 'http://localhost:8545');
    testService = module.get<TestAppService>(TestAppService);
    lcService = module.get<LendingClubService>(LendingClubService);
    await testService.prepareTest();
  });

  afterEach(async () => {
    await testService?.tearDownTest();
  });
  const getContractInstances = async () => {
    const userAddress = '0x27ca8e71026ea079ba8a3ef5d6e51ac4b962c0a3';
    const signer = await testService.impersonateAccount(userAddress);
    const market = await (async () => {
      const market = lcService.lcApi.markets
        .forNetwork(chainId)
        .getContractInstance('FTMUSDC');
      //await market.connect(signer).setDailyIssuanceLimit(parseEther('10000'));
      await testService.increaseTimeByOneDay();
      return market;
    })();
    const collateral = (() => {
      const wftmToken = MockToken__factory.connect(WFTM, signer);
      return wftmToken;
    })();
    const principal = (() => {
      const usdcToken = MockToken__factory.connect(USDC, signer);
      return usdcToken;
    })();
    const mockOracle = await (async () => {
      const oracleInfo = getExport(FAKE_ORACLE_DID, 31337);
      const oracle = MockAggregatorV3__factory.connect(
        oracleInfo.address,
        signer,
      );
      const chainlinkAdapter = lcService.lcApi.peripherals
        .forNetwork(chainId)
        .getContractInstance('chainlinkAdapter');
      const chainlinkAdapterOwner = await chainlinkAdapter.owner();
      const oracleSigner = await testService.impersonateAccount(
        chainlinkAdapterOwner,
      );
      await chainlinkAdapter
        .connect(oracleSigner)
        .setPriceFeed(WFTM, oracleInfo.address);
      await testService.stopImpersonateAccount(chainlinkAdapterOwner);
      return oracle;
    })();
    const realFtmOracle = await (async () => {
      const oracle = AggregatorV3Interface__factory.connect(
        CL_FTM_FEED,
        signer,
      );
      return oracle;
    })();
    const liquidationContract = (() => {
      const liquidationInfo = getExport(EQ_FTM_USDC_LIQ_DID, chainId);
      const liquidation = SimpleLiquidator__factory.connect(
        liquidationInfo.address,
        signer,
      );
      return liquidation;
    })();
    const usdcWhale = await (async () => {
      const usdcWhale = '0xa481f1cbd1193007a34a5ff6911db044e78d9a00';
      const usdcWhaleSigner = await testService.impersonateAccount(usdcWhale);
      return usdcWhaleSigner;
    })();
    const wftmWhale = await (async () => {
      const wftmWhale = '0x3e923747ca2675e096d812c3b24846ac39aed645';
      const wftmWhaleSigner = await testService.impersonateAccount(wftmWhale);
      return wftmWhaleSigner;
    })();
    return {
      market,
      collateral,
      principal,
      mockOracle,
      realFtmOracle,
      liquidationContract,
      signer,
      usdcWhale,
      wftmWhale,
    };
  };

  it('should deposit collateral and borrow principal and make a liquidatable market', async () => {
    const {
      market,
      collateral,
      principal,
      signer,
      usdcWhale,
      wftmWhale,
      mockOracle,
      realFtmOracle,
    } = await getContractInstances();
    const { answer: realFtmPrice } = await realFtmOracle.latestRoundData();
    const fakeFtmPrice = realFtmPrice.mul(110).div(100);
    await mockOracle.setAnswer(10, fakeFtmPrice, 1000, 1009, 10);
    await principal
      .connect(usdcWhale)
      .transfer(market.address, parseUnits('10000', 6));
    await collateral
      .connect(wftmWhale)
      .transfer(signer._address, parseUnits('10000', 18));

    const accountId = (await market.totalAccountsCreated()).toNumber();
    await market.connect(signer).openAccount();
    const depositAmount = parseUnits('28', await collateral.decimals());
    await collateral.approve(market.address, depositAmount);
    await market.connect(signer).deposit(accountId, depositAmount);

    const ftmPPAnswer = await market.getCollateralPrice();
    const borrowAmount = parseUnits('10', await principal.decimals());
    await market.connect(signer).borrow(accountId, borrowAmount);

    await mockOracle.setAnswer(10, realFtmPrice, 1000, 1009, 10);
    expect(await market.isLiquidatable(accountId)).toBeTruthy();
  });

  it('should get the provider', async () => {
    const { liquidateParams } = await liquidatableEnvironmentParameters();
    const provider = service.provider(liquidateParams);
    expect(provider).toBeDefined();
    expect(provider).toBeInstanceOf(ethers.providers.JsonRpcProvider);
  });

  it('should return an instance of the simpleSolidlyLiqu', async () => {
    const { liquidateParams } = await liquidatableEnvironmentParameters();
    const liquidationContract = await service.getLiquidationContract(
      liquidateParams,
    );
    expect(liquidationContract).toBeDefined();
    expect(liquidationContract).toBeInstanceOf(ethers.Contract);
  });
});

describe.only('the ultimate test for liquidating an account', () => {
  /**
   * @dev the fantom block number to fork from
   * MUST BE "60407021"
   * if the tests did not work, make sure you are forking from the correct block
   */
  let service: LiquidatorService;
  let evmService: EvmProviderService;
  let testService: TestAppService;
  let lcService: LendingClubService;
  let queryAccountsMock = jest.fn();
  let queryAssetsPricesMock = jest.fn();
  let lcApiMocker: LendingClubApi;
  const chainId = 250;
  const EQ_FTM_USDC_LIQ_DID = 'eq_ftm_usdc_liqu';
  const USDC = '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75';
  const WFTM = '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83';
  const FAKE_ORACLE_DID = 'fake_oracle';
  const CL_FTM_FEED = '0xf4766552D15AE4d256Ad41B6cf2933482B0680dc';

  beforeEach(async () => {
    jest.setTimeout(1000000);
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, EvmModule, TestAppModule.register({ chainId })],
      providers: [
        ConfigService,
        LiquidatorService,
        EvmProviderService,
        EventEmitter2,
      ],
    })
      .useMocker((token) => {
        if (token == LendingClubService) {
          return {
            queryAccounts: queryAccountsMock,
            queryAssetsPrices: queryAssetsPricesMock,
          };
        }
      })
      .compile();

    service = module.get<LiquidatorService>(LiquidatorService);
    evmService = module.get<EvmProviderService>(EvmProviderService);
    evmService.setProvider(chainId, 'http://127.0.0.1:8545');
    testService = module.get<TestAppService>(TestAppService);
    lcApiMocker = initLendingClubApi(evmService.getProviders());
    await testService.prepareTest();
  });

  afterEach(async () => {
    await testService?.tearDownTest();
  });

  const getContractInstances = async () => {
    const userAddress = '0x27ca8e71026ea079ba8a3ef5d6e51ac4b962c0a3';
    const signer = await testService.impersonateAccount(userAddress);
    const market = await (async () => {
      const market = lcApiMocker.markets
        .forNetwork(chainId)
        .getContractInstance('FTMUSDC');
      await testService.increaseTimeByOneDay();
      return market;
    })();
    const collateral = (() => {
      const wftmToken = MockToken__factory.connect(WFTM, signer);
      return wftmToken;
    })();
    const principal = (() => {
      const usdcToken = MockToken__factory.connect(USDC, signer);
      return usdcToken;
    })();
    const mockOracle = await (async () => {
      const oracleInfo = getExport(FAKE_ORACLE_DID, 31337);
      const oracle = MockAggregatorV3__factory.connect(
        oracleInfo.address,
        signer,
      );
      const chainlinkAdapter = lcApiMocker.peripherals
        .forNetwork(chainId)
        .getContractInstance('chainlinkAdapter');
      const chainlinkAdapterOwner = await chainlinkAdapter.owner();
      const oracleSigner = await testService.impersonateAccount(
        chainlinkAdapterOwner,
      );
      await chainlinkAdapter
        .connect(oracleSigner)
        .setPriceFeed(WFTM, oracleInfo.address);
      await testService.stopImpersonateAccount(chainlinkAdapterOwner);
      return oracle;
    })();
    const realFtmOracle = await (async () => {
      const oracle = AggregatorV3Interface__factory.connect(
        CL_FTM_FEED,
        signer,
      );
      return oracle;
    })();
    const liquidationContract = (() => {
      const liquidationInfo = getExport(EQ_FTM_USDC_LIQ_DID, chainId);
      const liquidation = SimpleLiquidator__factory.connect(
        liquidationInfo.address,
        signer,
      );
      return liquidation;
    })();
    const usdcWhale = await (async () => {
      const usdcWhale = '0xa481f1cbd1193007a34a5ff6911db044e78d9a00';
      const usdcWhaleSigner = await testService.impersonateAccount(usdcWhale);
      return usdcWhaleSigner;
    })();
    const wftmWhale = await (async () => {
      const wftmWhale = '0x3e923747ca2675e096d812c3b24846ac39aed645';
      const wftmWhaleSigner = await testService.impersonateAccount(wftmWhale);
      return wftmWhaleSigner;
    })();
    return {
      market,
      collateral,
      principal,
      mockOracle,
      realFtmOracle,
      liquidationContract,
      signer,
      usdcWhale,
      wftmWhale,
    };
  };

  const setupMarketOnChainForLiquidation = async () => {
    const {
      market,
      collateral,
      principal,
      signer,
      usdcWhale,
      wftmWhale,
      mockOracle,
      realFtmOracle,
    } = await getContractInstances();
    const { answer: realFtmPrice } = await realFtmOracle.latestRoundData();
    const fakeFtmPrice = realFtmPrice.mul(110).div(100);
    await mockOracle.setAnswer(10, fakeFtmPrice, 1000, 1009, 10);
    await principal
      .connect(usdcWhale)
      .transfer(market.address, parseUnits('10000', 6));
    await collateral
      .connect(wftmWhale)
      .transfer(signer._address, parseUnits('10000', 18));

    const accountId = (await market.totalAccountsCreated()).toNumber();
    await market.connect(signer).openAccount();
    const depositAmount = parseUnits('28', await collateral.decimals());
    await collateral.approve(market.address, depositAmount);
    await market.connect(signer).deposit(accountId, depositAmount);

    const ftmPPAnswer = await market.getCollateralPrice();
    const borrowAmount = parseUnits('10', await principal.decimals());
    await market.connect(signer).borrow(accountId, borrowAmount);

    await mockOracle.setAnswer(10, realFtmPrice, 1000, 1009, 10);

    return {
      fakeFtmPrice,
      realFtmPrice: realFtmPrice,
      accountId,
      depositAmount,
      borrowAmount,
      market,
      collateral,
      principal,
      signer,
      mockOracle,
    };
  };

  it('should liquidate account', async () => {
    const {
      fakeFtmPrice,
      realFtmPrice,
      accountId,
      depositAmount,
      borrowAmount,
      market,
      collateral,
      principal,
      signer,
      mockOracle,
    } = await setupMarketOnChainForLiquidation();
    const liquidationThreshold = bnToDecimal(
      await market.liquidationThreshold(),
      18,
    );
    const liquidationMaxHR = bnToDecimal(await market.liquidationMaxHR(), 18);
    const liquidationPenalty = bnToDecimal(
      await market.liquidationPenalty(),
      3,
    );
    let principalDB = assetFactory({ chaindId: 250 });
    principalDB.address = principal.address;
    principalDB.decimals = await principal.decimals();
    const debtPrice = parseUnits('1', 8)

    let collateralDB = assetFactory({ chaindId: 250 });
    collateralDB.address = collateral.address;
    const collateralPrice = realFtmPrice
    collateralDB.decimals = await collateral.decimals();

    let marketDB = marketFactory(principalDB, collateralDB, {
      liquidationThreshold,
      liquidationMaxHR,
      liquidationPenalty,
    });
    marketDB.principalAsset = Promise.resolve(principalDB);
    marketDB.collateralAsset = Promise.resolve(collateralDB);
    marketDB.closingFee = bnToDecimal(await market.closingFee(), 3);
    marketDB.address = market.address;
    marketDB.smallAccountThreshold = new Decimal(0)

    const collateralAmount = bnToDecimal(depositAmount, (await collateral.decimals()));
    const principalAmount = bnToDecimal(borrowAmount, (await principal.decimals()));

    let accountDB = accountFactory(marketDB, {
      collateralAmount,
      principalAmount,
    });
    accountDB.nftId = accountId;
    (await accountDB.market).address = market.address;

    const liquidateParams = liquidateEventFactory(
      accountDB,
      marketDB,
      collateralDB,
      principalDB,
    );

    // console.log('liquidationThreshold', (await market.liquidationThreshold()).toString());
    // console.log('liquidationMaxHR', (await market.liquidationMaxHR()).toString());
    // console.log('liquidationPenalty', (await market.liquidationPenalty()).toString());
    // console.log('closingFee', (await market.closingFee()).toString());
    // console.log('realFtmPrice', realFtmPrice.toString());
    // console.log('fakeFtmPrice', fakeFtmPrice.toString());
    // console.log('debtPrice', parseUnits('1', 8));
    // console.log('collateralDecimals', await collateral.decimals());
    // console.log('principalDecimals', await principal.decimals());
    // console.log('collateralAmount', depositAmount.toString());
    // console.log('principalAmount', borrowAmount.toString());

    queryAccountsMock.mockReturnValue([liquidateParams.account]);
    queryAssetsPricesMock.mockReturnValue({
      collateralPrice: collateralPrice,
      debtPrice: debtPrice,
    });
    // @ts-ignore
    const liquidationCallerSpy = jest.spyOn(service, 'callLiquidationContract');
    await service.tryToLiquidate(liquidateParams);
    expect(liquidationCallerSpy).toBeCalledTimes(1);
    expect(liquidationCallerSpy).toBeCalledWith(liquidateParams);
    expect(await market.isLiquidatable(accountId)).toBe(false);
  });
});
