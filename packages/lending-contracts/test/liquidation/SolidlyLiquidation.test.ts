import hre, { ethers, hardon } from "hardhat";
import { expect } from "chai";
import { ChainlinkPriceOracle__factory, ERC20__factory, PriceProvider__factory, SimpleInterestMarket__factory } from "../../typechain-types";
import { parseEther, parseUnits, formatUnits } from "ethers/lib/utils";
import { FTM_USDC_MARKET_DID } from "../../deploy/fantom/05_deploy_FTMUSDC";
import { PRICE_PROVIDER_DID } from "../../deploy/fantom/01_deploy_PriceProvider";
import { CHAINLINK_PRICE_ORACLE_DID } from "../../deploy/fantom/02_deploy_ChainlinkPriceOracle";
import { utils } from "ethers"
import { AggregatorV3Interface__factory } from "../../typechain-types/factories/contracts/oracles/interfaces";
import { time } from "@nomicfoundation/hardhat-network-helpers";

type SetupFixtureOptions = {

}

describe("SolidlyLiquidation", function () {
    const setUpTest = hre.deployments.createFixture(async (hre, options?: SetupFixtureOptions) => {
        const { deployer } = await hre.hardon.getHardhatSigners();
        const [treasury] = await hre.getUnnamedAccounts();
        await hardon.fork("fantom", 58437785);
        const deployments = await hre.deployments.fixture([FTM_USDC_MARKET_DID, CHAINLINK_PRICE_ORACLE_DID]);

        const ftmUsdcMarket = SimpleInterestMarket__factory.connect(deployments[FTM_USDC_MARKET_DID].address, deployer)
        await ftmUsdcMarket.setDailyIssuanceLimit(parseEther("10000"))
        await time.increase(time.duration.days(1));

        const priceProvider = PriceProvider__factory.connect(deployments[PRICE_PROVIDER_DID].address, deployer);
        const chainlinkOracle = ChainlinkPriceOracle__factory.connect(deployments[CHAINLINK_PRICE_ORACLE_DID].address, deployer)
        const clOracleFactory = await ethers.getContractFactory("MockAggregatorV3");
        const mockOracle = await clOracleFactory.deploy();
        const WFTM = ERC20__factory.connect(hardon.getExternalAddress("WFTM"), deployer);
        await chainlinkOracle.setPriceFeed(WFTM.address, mockOracle.address);
        const USDC = ERC20__factory.connect(hardon.getExternalAddress("USDC"), deployer);

        const liquidationFactory = await ethers.getContractFactory("SimpleSolidlyLiqu");
        const vUSDC_FTM_PAIR = "0x7547d05dFf1DA6B4A2eBB3f0833aFE3C62ABD9a1"
        const liquidation = await liquidationFactory.deploy(treasury, hre.hardon.getExternalAddress("EQ_PAIR_FACTORY"), vUSDC_FTM_PAIR)

        const realFtmOracle = AggregatorV3Interface__factory.connect(hre.hardon.getExternalAddress("CL_FTM_FEED"), deployer)
        const { answer: realFtmPrice } = await realFtmOracle.latestRoundData();
        const fakeFtmPrice = realFtmPrice.mul(110).div(100)
        await mockOracle.setAnswer(10, fakeFtmPrice, 1000, 1009, 10);

        const usdcWhale = await hre.hardon.impersonate(hre.hardon.getExternalAddress('USDC_WHALE'));
        await USDC.connect(usdcWhale).transfer(ftmUsdcMarket.address, parseUnits("10000", await USDC.decimals()));
        const wftmWhale = await hre.hardon.impersonate(hre.hardon.getExternalAddress("WFTM_WHALE"));
        await WFTM.connect(wftmWhale).transfer(deployer.address, await WFTM.balanceOf(wftmWhale.address));
        return { ftmUsdcMarket, priceProvider, mockOracle, WFTM, USDC, liquidation, treasury, realFtmPrice, fakeFtmPrice };
    })

    it("Should have deployed market", async () => {
        const { ftmUsdcMarket } = await setUpTest()
        expect(await ftmUsdcMarket.collateralToken()).to.exist
    })

    it("Should liquidate the account", async () => {
        const { ftmUsdcMarket, WFTM, USDC, mockOracle, liquidation, treasury, realFtmPrice, fakeFtmPrice } = await setUpTest();
        const accountId = await ftmUsdcMarket.totalAccountsCreated();
        await ftmUsdcMarket.openAccount();
        const depositAmount = parseUnits("100", await WFTM.decimals());
        await WFTM.approve(ftmUsdcMarket.address, depositAmount);
        await ftmUsdcMarket.deposit(accountId, depositAmount);

        const ftmPPAnswer = await ftmUsdcMarket.getCollateralPrice();

        const borrowAmount = ftmPPAnswer.mul(depositAmount).div(await ftmUsdcMarket.liquidationThreshold()).div(parseUnits("1", await WFTM.decimals() - await USDC.decimals()));
        await ftmUsdcMarket.updateSmallAccountThreshold(borrowAmount.sub(1));
        await ftmUsdcMarket.borrow(accountId, borrowAmount)

        await mockOracle.setAnswer(10, realFtmPrice, 1000, 1009, 10);
        expect(await ftmUsdcMarket.isLiquidatable(accountId)).to.be.true;

        const routerAddress = hardon.getExternalAddress("EQ_ROUTER");
        const route: { from: string, to: string, stable: boolean }[] = []
        const swapData = utils.defaultAbiCoder.encode(["address", "tuple(address from, address to, bool stable)[]"], [routerAddress, route]);

        const liquidationParams = utils.defaultAbiCoder.encode(
            ['tuple(address, uint256[], uint256[], bytes)'],
            [[ftmUsdcMarket.address, [accountId.toString()], [borrowAmount.toString()], swapData]]
        );
        const liquReward = await ftmUsdcMarket.liquidationPenalty();
        const liquRewardDecimals = await ftmUsdcMarket.LIQUIDATION_PENALTY_DECIMALS();
        const swapFees = parseUnits("0.003", liquRewardDecimals);
        // The Solidly Flashloans funds from LP, so we are borrowing our expected profit and all collateral will go to LP
        // If our swap had slippage we would also sub slippage
        await liquidation.liquidate(USDC.address, borrowAmount.mul(liquReward.sub(swapFees)).div(parseUnits("1", liquRewardDecimals)), liquidationParams);

        expect(await ftmUsdcMarket.principalAmount(accountId)).to.eq(0);
        expect(await USDC.balanceOf(treasury)).to.eq(borrowAmount.mul(1097).div(1000).sub(borrowAmount))

    })
})