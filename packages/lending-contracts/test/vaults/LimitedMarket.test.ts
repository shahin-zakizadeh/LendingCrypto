import hre, { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { parseEther, parseUnits, formatUnits } from "ethers/lib/utils";
import { BigNumberish, BigNumber, constants } from "ethers";
import { MARKET_IS_PAUSED, CALLER_IS_NOT_ADMINISTRATOR, NOT_ENOUGH_DAILY_ISSUANCE_LEFT } from "../helpers/errors";
import { ContractFactory } from 'ethers';
import { markets } from "../../typechain-types/contracts";
import { parse } from "dotenv";
import { time } from "@nomicfoundation/hardhat-network-helpers";


type SetupFixtureOptions = {
    availableSupply?: BigNumberish;
    interestRate?: BigNumberish;
    oraclePriceAnswer?: BigNumberish;
    liquidationThreshold?: BigNumberish;
    liquidationMaxHR?: BigNumber;
    liquidationPenalty?: BigNumberish;
    oracleDecimals?: number;
    name?: string;
    symbol?: string;
    baseURI?: string;
    closingFee?: BigNumberish;
    smallAccountThreshold?: BigNumberish;
}

const DEFAULT_PRICE_ANSWER = parseUnits("2", 8);

describe("LimitedMarket", function () {
    let limitedMarket;
    let deployer: SignerWithAddress;
    let user: SignerWithAddress;

    const setupTest = hre.deployments.createFixture(async (hre, options: SetupFixtureOptions | undefined) => {
        const LimitedMarket = await ethers.getContractFactory("LimitedMarket");
        const priceProviderFactory = await hre.ethers.getContractFactory("MockPriceProvider");
        const priceProvider = await priceProviderFactory.deploy(options?.oracleDecimals ?? 8)
        const liquidationThreshold = options?.liquidationThreshold ?? parseUnits("1.1", 18);
        const name = options?.name ?? "test-vault";
        const symbol = options?.symbol ?? "TV";
        const ercFactory = await hre.ethers.getContractFactory("MockToken");
        const collateralToken = await ercFactory.deploy(18, "collateral", "COL")
        const debtToken = await ercFactory.deploy(18, "debt", "DEB")
        await priceProvider.setSafePrice(collateralToken.address, options?.oraclePriceAnswer ?? DEFAULT_PRICE_ANSWER)

        const baseURI = options?.baseURI ?? "hello-world";

        limitedMarket = await LimitedMarket.deploy(
            priceProvider.address,
            liquidationThreshold,
            name,
            symbol,
            debtToken.address,
            collateralToken.address,
            baseURI,
            options?.liquidationMaxHR ?? constants.MaxUint256,
            options?.liquidationPenalty ?? "1100",
            options?.closingFee ?? 0
        );
        await time.increase(time.duration.days(1));
        return { debtToken, collateralToken, priceProvider, limitedMarket, }
    });

    this.beforeAll(async () => {

        ({ deployer } = await hre.hardon.getHardhatSigners());
        ([user] = await hre.hardon.getUnnamedSigners());

    })

    it("should not allow non-admin to set dailyIssuanceLimit", async () => {
        const { limitedMarket } = await setupTest();
        const newLimit = parseEther("100");
        await expect(limitedMarket.connect(user).setDailyIssuanceLimit(newLimit))
            .to.be.revertedWith(CALLER_IS_NOT_ADMINISTRATOR);
    });

    it("should allow admin to call setDailyIssuanceLimit", async () => {
        const { limitedMarket } = await setupTest();
        const newLimit = parseEther("100")
        await expect(limitedMarket.connect(deployer).setDailyIssuanceLimit(newLimit)).to.not.be.reverted;
    });

    it("should set the daily issuance limit correctly", async () => {
        const { limitedMarket } = await setupTest();
        const newLimit = parseEther("100");
        await limitedMarket.connect(deployer).setDailyIssuanceLimit(newLimit);
        const actualLimit = await limitedMarket.dailyIssuanceLimit();
        expect(actualLimit).to.equal(newLimit);
    });

    it("should update daily issuance left correctly", async function () {
        const { limitedMarket, collateralToken, debtToken } = await setupTest();
        const SECONDS_PER_HOUR = 3600;
        const collateralAmount = parseEther("1000");
        const newLimit = parseEther("48");
        const hourlyReplenishingRate = parseEther("2");

        // Set the daily issuance limit and check that it is set correctly
        await limitedMarket.connect(deployer).setDailyIssuanceLimit(newLimit);
        await time.increase(time.duration.days(1));
        expect(await limitedMarket.dailyIssuanceLimit()).to.equal(newLimit);
        expect(await limitedMarket.getIssuanceLeft()).to.equal(newLimit);
        // Borrow 20 tokens and check that the daily issuance left is updated correctly
        await collateralToken.mint(user.address, collateralAmount);
        await collateralToken.connect(user).approve(limitedMarket.address, collateralAmount);

        const accountID = await limitedMarket.totalAccountsCreated();
        await limitedMarket.connect(user).openAccount();
        await limitedMarket.connect(user).deposit(accountID, collateralAmount);
        await debtToken.mint(limitedMarket.address, parseEther("20"));
        await limitedMarket.connect(user).borrow(accountID, parseEther("20"));
        expect(await limitedMarket.getIssuanceLeft()).to.equal(parseEther("28"));

        // Wait 1 hour and borrow 10 tokens and check that the daily issuance left is updated correctly
        await time.increase(SECONDS_PER_HOUR);
        await debtToken.mint(limitedMarket.address, parseEther("10"));
        await limitedMarket.connect(user).borrow(accountID, parseEther("10"));
        expect(await limitedMarket.getIssuanceLeft()).closeTo((parseEther("28").add(hourlyReplenishingRate).sub(parseEther("10"))), parseEther("0.02"));

        // Wait 10000 hours and borrow 48 tokens and check that the daily issuance left is updated correctly
        await time.increase(SECONDS_PER_HOUR * 10000);
        await debtToken.mint(limitedMarket.address, parseEther("48"));
        await limitedMarket.connect(user).borrow(accountID, parseEther("48"));
        expect(await limitedMarket.getIssuanceLeft()).to.equal(parseEther("0"));
    });

    it("should inherit from the pausable market", async function () {
        const { limitedMarket, collateralToken, debtToken } = await setupTest();
        const collateralAmount = parseEther("1000");
        await limitedMarket.setDailyIssuanceLimit(collateralAmount)
        await time.increase(time.duration.days(1))


        await limitedMarket.connect(deployer).pause();
        await collateralToken.mint(user.address, collateralAmount);
        await collateralToken.connect(user).approve(limitedMarket.address, collateralAmount);
        const accountID = await limitedMarket.totalAccountsCreated();
        await limitedMarket.connect(user).openAccount();
        await limitedMarket.connect(user).deposit(accountID, collateralAmount);
        await debtToken.mint(limitedMarket.address, parseEther("20"));
        await expect(limitedMarket.connect(user).borrow(accountID, parseEther("20")))
            .to.be.revertedWith(MARKET_IS_PAUSED);
        await limitedMarket.connect(deployer).unpause();
        await expect(await limitedMarket.isPaused()).to.equal(false);
    });

    it("should decrease the daily issuance left when someone borrow", async function () {
        const { limitedMarket, collateralToken, debtToken } = await setupTest();
        const collateralAmount = parseEther("1000");
        const newLimit = parseEther("48");

        await limitedMarket.connect(deployer).setDailyIssuanceLimit(newLimit);
        await time.increase(time.duration.days(1));
        expect(await limitedMarket.dailyIssuanceLimit()).to.equal(newLimit);
        await collateralToken.mint(user.address, collateralAmount);
        await collateralToken.connect(user).approve(limitedMarket.address, collateralAmount);
        const accountID = await limitedMarket.totalAccountsCreated();
        await limitedMarket.connect(user).openAccount();
        await limitedMarket.connect(user).deposit(accountID, collateralAmount);
        await debtToken.mint(limitedMarket.address, parseEther("20"));
        await limitedMarket.connect(user).borrow(accountID, parseEther("20"));
        expect(await limitedMarket.getIssuanceLeft()).to.equal(parseEther("28"));

    });

    it("It should be revert if amount is smaller than currentIssuanceLeft", async function () {
        const { limitedMarket, collateralToken, debtToken } = await setupTest();
        const collateralAmount = parseEther("1000");
        const newLimit = parseEther("48");

        await limitedMarket.connect(deployer).setDailyIssuanceLimit(newLimit);
        await time.increase(time.duration.days(1));
        expect(await limitedMarket.dailyIssuanceLimit()).to.equal(newLimit);
        await collateralToken.mint(user.address, collateralAmount);
        await collateralToken.connect(user).approve(limitedMarket.address, collateralAmount);
        const accountID = await limitedMarket.totalAccountsCreated();
        await limitedMarket.connect(user).openAccount();
        await limitedMarket.connect(user).deposit(accountID, collateralAmount);
        await debtToken.mint(limitedMarket.address, parseEther("20"));
        await limitedMarket.connect(user).borrow(accountID, parseEther("20"));
        expect(await limitedMarket.getIssuanceLeft()).to.equal(parseEther("28"));
        await expect(limitedMarket.connect(user).borrow(accountID, parseEther("29")))
            .to.be.revertedWith(NOT_ENOUGH_DAILY_ISSUANCE_LEFT);

    });

    it("should replenish the daily issuance limit back with time", async function () {
        const { limitedMarket, collateralToken, debtToken } = await setupTest();
        const SECONDS_PER_HOUR = 3600;
        const collateralAmount = parseEther("1000");
        const newLimit = parseEther("48");

        await limitedMarket.connect(deployer).setDailyIssuanceLimit(newLimit);
        await time.increase(time.duration.days(1));
        expect(await limitedMarket.dailyIssuanceLimit()).to.equal(newLimit);
        expect(await limitedMarket.getIssuanceLeft()).to.equal(newLimit);

        await collateralToken.mint(user.address, collateralAmount);
        await collateralToken.connect(user).approve(limitedMarket.address, collateralAmount);
        const accountID = await limitedMarket.totalAccountsCreated();
        await limitedMarket.connect(user).openAccount();
        await limitedMarket.connect(user).deposit(accountID, collateralAmount);
        await debtToken.mint(limitedMarket.address, parseEther("20"));
        await limitedMarket.connect(user).borrow(accountID, parseEther("20"));
        expect(await limitedMarket.getIssuanceLeft()).to.equal(parseEther("28"));

        await time.increase(SECONDS_PER_HOUR * 10000);
        await debtToken.mint(limitedMarket.address, parseEther("48"));
        expect(await limitedMarket.getIssuanceLeft()).to.equal(parseEther("48"));

    });

    it("Should recover the issuance when principal is repaid", async () => {
        const { limitedMarket, collateralToken, debtToken } = await setupTest();
        const SECONDS_PER_HOUR = 3600;
        const collateralAmount = parseEther("1000");
        const principalAmount = parseEther("20");
        const issuanceLimit = parseEther("48");

        await limitedMarket.connect(deployer).setDailyIssuanceLimit(issuanceLimit);
        await time.increase(time.duration.days(1));

        await collateralToken.mint(user.address, collateralAmount);
        await collateralToken.connect(user).approve(limitedMarket.address, collateralAmount);
        const accountID = await limitedMarket.totalAccountsCreated();
        await limitedMarket.connect(user).openAccount();
        await limitedMarket.connect(user).deposit(accountID, collateralAmount);
        await debtToken.mint(limitedMarket.address, principalAmount);
        await limitedMarket.connect(user).borrow(accountID, principalAmount);
        await debtToken.connect(user).approve(limitedMarket.address, principalAmount);
        await limitedMarket.connect(user).repay(accountID, principalAmount);

        expect(await limitedMarket.getIssuanceLeft()).to.eq(issuanceLimit)
    })

    it("Should not recover more than issuance limit when principal is repaid", async () => {
        const { limitedMarket, collateralToken, debtToken } = await setupTest();
        const SECONDS_PER_HOUR = 3600;
        const collateralAmount = parseEther("1000");
        const principalAmount = parseEther("20");
        const issuanceLimit = parseEther("48");

        await limitedMarket.connect(deployer).setDailyIssuanceLimit(issuanceLimit);
        await time.increase(time.duration.days(1));

        await collateralToken.mint(user.address, collateralAmount);
        await collateralToken.connect(user).approve(limitedMarket.address, collateralAmount);
        const accountID = await limitedMarket.totalAccountsCreated();
        await limitedMarket.connect(user).openAccount();
        await limitedMarket.connect(user).deposit(accountID, collateralAmount);
        await debtToken.mint(limitedMarket.address, principalAmount);
        await limitedMarket.connect(user).borrow(accountID, principalAmount);
        await time.increase(time.duration.days(1));
        await debtToken.connect(user).approve(limitedMarket.address, principalAmount);
        await limitedMarket.connect(user).repay(accountID, principalAmount);

        expect(await limitedMarket.getIssuanceLeft()).to.eq(issuanceLimit)
    })
});
