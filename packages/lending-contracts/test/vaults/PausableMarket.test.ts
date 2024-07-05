import hre, { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { parseEther, parseUnits, formatUnits } from "ethers/lib/utils";
import { BigNumberish, BigNumber, constants } from "ethers";
import { MARKET_IS_PAUSED, CALLER_IS_NOT_ADMINISTRATOR } from "../helpers/errors";
import { ContractFactory } from 'ethers';
import { markets } from "../../typechain-types/contracts";


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

describe("PausableMarket", function () {
    let pausableMarket;
    let deployer: SignerWithAddress;
    let user: SignerWithAddress;

    const setupTest = hre.deployments.createFixture(async (hre, options: SetupFixtureOptions | undefined) => {

        const PausableMarket = await ethers.getContractFactory("PausableMarket");
        const priceProviderFactory = await hre.ethers.getContractFactory("MockPriceProvider");
        const priceProvider = await priceProviderFactory.deploy(options?.oracleDecimals ?? 8)
        const liquidationThreshold = options?.liquidationThreshold ?? parseUnits("1.1", 18);
        const name = options?.name ?? "test-vault";
        const symbol = options?.symbol ?? "TV";
        const ercFactory: ContractFactory = await hre.ethers.getContractFactory("MockToken");
        const collateralToken = await ercFactory.deploy(18, "collateral", "COL")
        const debtToken = await ercFactory.deploy(18, "debt", "DEB")
        await priceProvider.setSafePrice(collateralToken.address, options?.oraclePriceAnswer ?? DEFAULT_PRICE_ANSWER)

        const baseURI = options?.baseURI ?? "hello-world";

        pausableMarket = await PausableMarket.deploy(
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
        await pausableMarket.deployed();
        return { debtToken, collateralToken, priceProvider, pausableMarket, }
    });

    this.beforeAll(async () => {
        ({ deployer } = await hre.hardon.getHardhatSigners());
        ([user] = await hre.hardon.getUnnamedSigners());
    })


    it("should allow users to borrow tokens normally", async () => {

        const collateralAmount = parseEther("100");
        const debtAmount = parseEther("10");
        const { collateralToken, debtToken, pausableMarket } = await setupTest();

        await collateralToken.mint(user.address, collateralAmount);
        await collateralToken.connect(user).approve(pausableMarket.address, collateralAmount);

        const accountID = await pausableMarket.totalAccountsCreated();
        await pausableMarket.connect(user).openAccount();
        await pausableMarket.connect(user).deposit(accountID, collateralAmount);
        await debtToken.mint(pausableMarket.address, debtAmount);
        await pausableMarket.connect(user).borrow(accountID, debtAmount);

        expect(await debtToken.balanceOf(user.address)).to.eq(debtAmount);
        expect(await pausableMarket.principalAmount(accountID)).to.eq(debtAmount);

    });


    it("should revert if the market is paused", async () => {
        const collateralAmount = parseEther("100");
        const debtAmount = parseEther("10");
        const { collateralToken, debtToken, pausableMarket } = await setupTest();

        await collateralToken.mint(user.address, collateralAmount);
        await collateralToken.connect(user).approve(pausableMarket.address, collateralAmount);

        const accountID = await pausableMarket.totalAccountsCreated();
        await pausableMarket.connect(user).openAccount();
        await pausableMarket.connect(user).deposit(accountID, collateralAmount);
        await debtToken.mint(pausableMarket.address, debtAmount);
        await pausableMarket.connect(user).borrow(accountID, debtAmount);

        await pausableMarket.pause();

        await expect(pausableMarket.connect(user).borrow(accountID, debtAmount)).to.be.revertedWith(MARKET_IS_PAUSED);
    });

    it("should revert if non-administrator calls pause", async () => {
        const { pausableMarket } = await setupTest();
        await expect(pausableMarket.connect(user).pause()).to.be.revertedWith(CALLER_IS_NOT_ADMINISTRATOR);
    });

    it("should be paused after administrator calls pause", async () => {
        const { pausableMarket } = await setupTest();
        await pausableMarket.connect(deployer).pause();
        expect(await pausableMarket.connect(deployer).paused()).to.be.true;
    });

    it("should revert if non-administrator calls unpause", async () => {
        const { pausableMarket } = await setupTest();
        await expect(pausableMarket.connect(user).unpause()).to.be.revertedWith(CALLER_IS_NOT_ADMINISTRATOR);
    });

    it("should be unpaused after administrator calls unpause", async () => {
        const { pausableMarket } = await setupTest();
        await pausableMarket.connect(deployer).pause();
        await pausableMarket.connect(deployer).unpause();
        expect(await pausableMarket.connect(deployer).paused()).to.be.false;
    });

    it("should show the contract is paused when administrator calls pause", async () => {
        const { pausableMarket } = await setupTest();
        await pausableMarket.pause();
        const paused = await pausableMarket.isPaused();
        expect(paused).to.equal(true);
    });

    it("should show the contract is unpaused when administrator calls unpause", async () => {
        const { pausableMarket } = await setupTest();
        await pausableMarket.pause();
        await pausableMarket.unpause();
        const paused = await pausableMarket.isPaused();
        expect(paused).to.equal(false);
    });

    it("should not revert if caller is the administrator for addCircuitBreaker function", async () => {
        const { pausableMarket } = await setupTest();

        await expect(pausableMarket.connect(deployer).addCircuitBreaker(user.address)).not.to.be.reverted;
        await expect(await pausableMarket.isCircuitBreaker(user.address)).to.be.true;
    });

    it("should revert if caller is not the administrator for addCircuitBreaker function", async () => {
        const { pausableMarket } = await setupTest();

        await expect(pausableMarket.connect(user).addCircuitBreaker(user.address)).to.be.revertedWith(CALLER_IS_NOT_ADMINISTRATOR);
    });

    it("should remove circuit breaker successfully when called by an admin", async () => {
        const { pausableMarket } = await setupTest();
        await pausableMarket.connect(deployer).addCircuitBreaker(user.address)
        await expect(pausableMarket.connect(deployer).removeCircuitBreaker(user.address)).not.to.be.reverted;
        expect(await pausableMarket.isCircuitBreaker(user.address));
    });

    it("should revert if caller is not the administrator for removeCircuitBreaker function", async () => {
        const { pausableMarket } = await setupTest();

        await expect(pausableMarket.connect(user).removeCircuitBreaker(user.address)).to.be.revertedWith(CALLER_IS_NOT_ADMINISTRATOR);
        await expect(await pausableMarket.isCircuitBreaker(user.address)).to.be.false;
    });

    it("should revert if caller is not the deployer account for triggerCircuitBreaker", async () => {
        const { pausableMarket, } = await setupTest();
        await expect(pausableMarket.connect(user).triggerCircuitBreaker())
            .to.be.revertedWith("AccessControl: account " + user.address.toLowerCase() + " is missing role " + await pausableMarket.CIRCUIT_BREAKER_ROLE());
    });

    it("should not revert if the caller is a circuit breaker and the contract should be paused for triggerCircuitBreaker", async () => {
        const { pausableMarket } = await setupTest();

        await expect(await pausableMarket.isPaused()).to.equal(false);
        await expect(pausableMarket.connect(deployer).addCircuitBreaker(user.address)).not.to.be.reverted;
        await expect(pausableMarket.connect(user).triggerCircuitBreaker()).not.to.be.reverted;

        await expect(await pausableMarket.isPaused()).to.equal(true);
    });

});
