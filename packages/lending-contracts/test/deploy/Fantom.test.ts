import hre, { ethers, hardon } from "hardhat";
import { expect } from "chai";
import { parseEther, parseUnits, formatUnits } from "ethers/lib/utils";
import { PRICE_PROVIDER_DID } from "../../deploy/fantom/01_deploy_PriceProvider";
import { CHAINLINK_PRICE_ORACLE_DID } from "../../deploy/fantom/02_deploy_ChainlinkPriceOracle";
import { FTM_USDC_MARKET_DID } from "../../deploy/fantom/05_deploy_FTMUSDC";
import { FANTOM_SETUP } from "../../utils/deployments-tags";
import { ERC20__factory, ChainlinkPriceOracle__factory, PriceProvider__factory, SimpleInterestMarket__factory } from "../../typechain-types";
import { AggregatorV3Interface__factory } from "../../typechain-types/factories/contracts/oracles/interfaces";
import { time } from "@nomicfoundation/hardhat-network-helpers";
type SetupFixtureOptions = {

}

describe("Fantom", function () {
    const setUpTest = hre.deployments.createFixture(async (hre, options?: SetupFixtureOptions) => {
        const { deployer } = await hre.hardon.getHardhatSigners();
        await hardon.fork("fantom", 58437785);
        const deployments = await hre.deployments.fixture(
            [FANTOM_SETUP]
        );

        const ftmUsdcMarket = SimpleInterestMarket__factory.connect(deployments[FTM_USDC_MARKET_DID].address, deployer);
        const priceProvider = PriceProvider__factory.connect(deployments[PRICE_PROVIDER_DID].address, deployer)
        const chainlinkOracle = ChainlinkPriceOracle__factory.connect(deployments[CHAINLINK_PRICE_ORACLE_DID].address, deployer)

        const WFTM = ERC20__factory.connect(hardon.getExternalAddress("WFTM"), deployer);

        const USDC = ERC20__factory.connect(hardon.getExternalAddress("USDC"), deployer);

        const realFtmOracle = AggregatorV3Interface__factory.connect(hre.hardon.getExternalAddress("CL_FTM_FEED"), deployer)
        const realUsdcOracle = AggregatorV3Interface__factory.connect(hre.hardon.getExternalAddress("CL_USDC_FEED"), deployer)

        const usdcWhale = await hre.hardon.impersonate(hre.hardon.getExternalAddress('USDC_WHALE'));
        const availableUSDC = parseUnits("10000", await USDC.decimals());
        await USDC.connect(usdcWhale).transfer(ftmUsdcMarket.address, availableUSDC);
        await ftmUsdcMarket.setDailyIssuanceLimit(availableUSDC);
        await time.increase(time.duration.days(1));
        const wftmWhale = await hre.hardon.impersonate(hre.hardon.getExternalAddress("WFTM_WHALE"));
        await WFTM.connect(wftmWhale).transfer(deployer.address, await WFTM.balanceOf(wftmWhale.address));
        return { ftmUsdcMarket, priceProvider, WFTM, USDC, chainlinkOracle, realFtmOracle, realUsdcOracle };

    })

    it("should verify the FTM market is deployed", async () => {
        const deployment = await setUpTest();
        const simpleInterestMarketDeployment = await hre.deployments.get(FTM_USDC_MARKET_DID);

        expect(simpleInterestMarketDeployment.address).to.exist;
    });

    it("should see the price of collateral and principal are properly configured", async () => {
        const { ftmUsdcMarket, priceProvider, chainlinkOracle, WFTM, USDC, realFtmOracle, realUsdcOracle } = await setUpTest();

        const collateralTokenAddress = await ftmUsdcMarket.collateralToken();
        const principalTokenAddress = await ftmUsdcMarket.debtToken();

        const FTM_ADDRESS = hre.hardon.getExternalAddress("WFTM");
        const USDC_ADDRESS = hre.hardon.getExternalAddress("USDC");

        expect(collateralTokenAddress).to.equal(FTM_ADDRESS);
        expect(principalTokenAddress).to.equal(USDC_ADDRESS);

        const collateralPrice = await priceProvider.getCurrentPrice(collateralTokenAddress);
        const principalPrice = await priceProvider.getCurrentPrice(principalTokenAddress);

        const { answer: realFtmPrice } = await realFtmOracle.latestRoundData();
        const { answer: realUsdcPrice } = await realUsdcOracle.latestRoundData();

        expect(collateralPrice).to.not.equal(0);
        expect(principalPrice).to.not.equal(0);


        const priceDecimalsAdjustment = parseUnits("1", 10)

        const adjustedRealFtmPrice = realFtmPrice.mul(priceDecimalsAdjustment);
        const adjustedRealUsdcPrice = realUsdcPrice.mul(priceDecimalsAdjustment)


        expect(adjustedRealFtmPrice).to.closeTo(collateralPrice, 10 ** 8);
        expect(adjustedRealUsdcPrice).to.be.closeTo(principalPrice, 10 ** 8);


    });




    it("should allow the user to deposit", async () => {
        const { ftmUsdcMarket, WFTM, USDC } = await setUpTest();
        const accountId = await ftmUsdcMarket.totalAccountsCreated();
        await ftmUsdcMarket.openAccount();
        const depositAmount = parseUnits("100", await WFTM.decimals());

        const userBalanceBefore = await WFTM.balanceOf(ftmUsdcMarket.address);
        await WFTM.approve(ftmUsdcMarket.address, depositAmount);
        await ftmUsdcMarket.deposit(accountId, depositAmount);
        const userBalanceAfter = await WFTM.balanceOf(ftmUsdcMarket.address);

        expect(await ftmUsdcMarket.collateralAmount(accountId)).to.equal(depositAmount);
        expect(userBalanceAfter.sub(userBalanceBefore)).to.equal(depositAmount);
    });



    it("Should allow user to borrow", async () => {
        const { ftmUsdcMarket, WFTM, USDC } = await setUpTest();
        const accountId = await ftmUsdcMarket.totalAccountsCreated();
        await ftmUsdcMarket.openAccount();
        const depositAmount = parseUnits("100", await WFTM.decimals());
        await WFTM.approve(ftmUsdcMarket.address, depositAmount);
        await ftmUsdcMarket.deposit(accountId, depositAmount);

        const ftmPPAnswer = await ftmUsdcMarket.getCollateralPrice();
        const borrowAmount = parseUnits("5", await USDC.decimals());
        const userBalanceBefore = await USDC.balanceOf(ftmUsdcMarket.address);

        await ftmUsdcMarket.borrow(accountId, borrowAmount);
        const userBalanceAfter = await USDC.balanceOf(ftmUsdcMarket.address);

        expect(await ftmUsdcMarket.principalAmount(accountId)).to.equal(borrowAmount);
        expect(userBalanceBefore.sub(userBalanceAfter)).to.equal(borrowAmount);
    });


    it("Should allow user to repay", async () => {
        const { ftmUsdcMarket, WFTM, USDC } = await setUpTest();
        const accountId = await ftmUsdcMarket.totalAccountsCreated();
        await ftmUsdcMarket.openAccount();
        const depositAmount = parseUnits("100", await WFTM.decimals());
        await WFTM.approve(ftmUsdcMarket.address, depositAmount);
        await ftmUsdcMarket.deposit(accountId, depositAmount);

        const ftmPPAnswer = await ftmUsdcMarket.getCollateralPrice();
        const borrowAmount = parseUnits("5", await USDC.decimals());
        await ftmUsdcMarket.borrow(accountId, borrowAmount);

        const repayAmount = parseUnits("1", await USDC.decimals());
        const userBalanceBefore = await USDC.balanceOf(ftmUsdcMarket.address);

        await USDC.approve(ftmUsdcMarket.address, repayAmount);
        await ftmUsdcMarket.repay(accountId, repayAmount);
        const userBalanceAfter = await USDC.balanceOf(ftmUsdcMarket.address);

        expect(await ftmUsdcMarket.principalAmount(accountId)).to.equal(borrowAmount.sub(repayAmount));
        expect(userBalanceAfter.sub(userBalanceBefore)).to.equal(repayAmount);
    });


    it("should properly calculate health ratio", async () => {
        const { ftmUsdcMarket, WFTM, USDC } = await setUpTest();

        const accountId = await ftmUsdcMarket.totalAccountsCreated();
        await ftmUsdcMarket.openAccount();

        const depositAmount = parseUnits("50", await WFTM.decimals());
        await WFTM.approve(ftmUsdcMarket.address, depositAmount);
        await ftmUsdcMarket.deposit(accountId, depositAmount);
        const borrowAmount = parseUnits("5", await USDC.decimals());
        await ftmUsdcMarket.borrow(accountId, borrowAmount);

        const healthRatio = await ftmUsdcMarket.calculateHealthRatio(accountId);
        const collateralPrice = await ftmUsdcMarket.getCollateralPrice();
        const principalPrice = await ftmUsdcMarket.getDebtPrice();
        const liquidationThreshold = await ftmUsdcMarket.liquidationThreshold();

        const WFTM_DECIMALS = await WFTM.decimals();
        const USDC_DECIMALS = await USDC.decimals();
        const PRICE_DECIMALS = 18;

        const collateralDecimalsAdjustment = parseUnits("1", PRICE_DECIMALS - USDC_DECIMALS);
        const adjustedCollateralPrice = collateralPrice.mul(collateralDecimalsAdjustment);

        const borrowAmountDecimalsAdjustment = parseUnits("1", USDC_DECIMALS);
        const adjustedBorrowAmount = borrowAmount.mul(borrowAmountDecimalsAdjustment);

        const principalPriceDecimalsAdjustment = parseUnits("1", PRICE_DECIMALS);
        const adjustedPrincipalPrice = principalPrice.div(principalPriceDecimalsAdjustment);

        const expectedHealthRatio = depositAmount
            .mul(adjustedCollateralPrice)
            .div(adjustedBorrowAmount.mul(adjustedPrincipalPrice).mul(liquidationThreshold));

        expect(healthRatio).to.be.closeTo(expectedHealthRatio, 10 ** 8);
    });


    it("should allow user to withdraw", async () => {
        const { ftmUsdcMarket, WFTM, USDC } = await setUpTest();
        const accountId = await ftmUsdcMarket.totalAccountsCreated();
        await ftmUsdcMarket.openAccount();
        const depositAmount = parseUnits("100", await WFTM.decimals());
        await WFTM.approve(ftmUsdcMarket.address, depositAmount);
        await ftmUsdcMarket.deposit(accountId, depositAmount);

        const withdrawAmount = parseUnits("10", await WFTM.decimals());
        const userBalanceBefore = await WFTM.balanceOf(ftmUsdcMarket.address);

        await ftmUsdcMarket.withdraw(accountId, withdrawAmount);
        const userBalanceAfter = await WFTM.balanceOf(ftmUsdcMarket.address);

        expect(await ftmUsdcMarket.collateralAmount(accountId)).to.equal(depositAmount.sub(withdrawAmount));
        expect(userBalanceBefore.sub(userBalanceAfter)).to.equal(withdrawAmount);
    });



    it("should liquidate account", async () => {
        const { ftmUsdcMarket, priceProvider, chainlinkOracle, WFTM, USDC, realFtmOracle } = await setUpTest();

        const clOracleFactory = await ethers.getContractFactory("MockAggregatorV3");
        const mockOracle = await clOracleFactory.deploy();

        await chainlinkOracle.setPriceFeed(WFTM.address, mockOracle.address);

        const { answer: realFtmPrice } = await realFtmOracle.latestRoundData();

        await mockOracle.setAnswer(10, realFtmPrice, 1000, 1009, 10);

        const accountId = await ftmUsdcMarket.totalAccountsCreated();
        await ftmUsdcMarket.openAccount();
        const depositAmount = parseUnits("100", await WFTM.decimals());
        await WFTM.approve(ftmUsdcMarket.address, depositAmount);
        await ftmUsdcMarket.deposit(accountId, depositAmount);

        const ftmPPAnswer = await ftmUsdcMarket.getCollateralPrice();

        const borrowAmount = ftmPPAnswer.mul(depositAmount).div(await ftmUsdcMarket.liquidationThreshold()).div(parseUnits("1", await WFTM.decimals() - await USDC.decimals()));

        await ftmUsdcMarket.updateSmallAccountThreshold(borrowAmount.sub(1));
        await ftmUsdcMarket.borrow(accountId, borrowAmount);

        // Decrease the collateral price to trigger liquidation
        const fakeFtmPrice = realFtmPrice.mul(95).div(100);

        await mockOracle.setAnswer(10, fakeFtmPrice, 1000, 1009, 10);

        expect(await ftmUsdcMarket.isLiquidatable(accountId)).to.be.true;


        await USDC.approve(ftmUsdcMarket.address, borrowAmount);

        await ftmUsdcMarket.liquidate(accountId, borrowAmount);
        expect(await ftmUsdcMarket.principalAmount(accountId)).to.equal(0);
    });


})
