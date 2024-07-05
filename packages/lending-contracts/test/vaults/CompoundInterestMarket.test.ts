import hre, { ethers, hardon } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { parseEther, parseUnits, formatUnits } from "ethers/lib/utils";
import { BigNumberish, BigNumber, constants } from "ethers";
import { calculateCompoundInterest } from "../helpers/compoundInterest"

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

describe.skip("CompoundInterestMarket", function () {
    let deployer: SignerWithAddress;
    let user: SignerWithAddress;

    // TODO: add tests with different decimals value for oracle and collateral
    const setupTest = hre.deployments.createFixture(async (hre, options: SetupFixtureOptions | undefined) => {

        const ercFactory = await hre.ethers.getContractFactory("MockToken");
        const debtToken = await ercFactory.deploy(18, "debt", "DEB")
        const collateralToken = await ercFactory.deploy(18, "collateral", "COL")
        const priceProviderFactory = await hre.ethers.getContractFactory("MockPriceProvider");
        const oraclesDecimals = options?.oracleDecimals ?? 8;
        const priceProvider = await priceProviderFactory.deploy(oraclesDecimals);
        await priceProvider.setSafePrice(collateralToken.address, options?.oraclePriceAnswer ?? parseUnits("2", oraclesDecimals))
        const marketFactory = await hre.ethers.getContractFactory("CompoundInterestMarket");// test connects to the BaseMarket contract

        // deploy parameters
        const liquidationThreshold = options?.liquidationThreshold ?? parseUnits("1.1", 18);
        const name = options?.name ?? "test-vault";
        const symbol = options?.symbol ?? "TV";
        const baseURI = options?.baseURI ?? "hello-world";

        const market = await marketFactory.deploy(
            //these are based on the constructor in the Basevalut contract line 50
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
        )
        await market.setInterestRate(options?.interestRate ?? 0);
        await market.updateSmallAccountThreshold(options?.smallAccountThreshold ?? 0);
        await debtToken.mint(market.address, options?.availableSupply ?? parseEther("10000"))
        return { debtToken, collateralToken, priceProvider, market: market, }
    })

    this.beforeAll(async () => {
        ({ deployer } = await hre.hardon.getHardhatSigners());
        ([user] = await hre.hardon.getUnnamedSigners());
    })

    it("Should update interest", async () => {
        const INTEREST_RATE = parseUnits("0.01", 18);
        const { market: vault } = await setupTest({ interestRate: INTEREST_RATE })

        const oneYearInSeconds = 31536000;
        const date = new Date(Date.now() + oneYearInSeconds * 1000);
        await hardon.setTimestamp(date);
        await vault.compoundInterest();

        const newInterestIndex = await vault.interestIndex();
        expect(newInterestIndex).gt(INTEREST_RATE.add(parseEther("1")))
    })

    it("Should update the PA correctly when the interest rate is 1% per year", async () => {

        // Given a principal amount of 1000 and a yearly interest rate of 1% 
        const INTEREST_RATE = parseUnits("0.01", 18);
        const PRINCIPAL_AMOUNT = parseEther("1");

        const { market: vault, collateralToken, priceProvider, debtToken } = await setupTest({ interestRate: INTEREST_RATE });
        const firstDeposit = parseEther("1000");
        await collateralToken.mint(user.address, firstDeposit);
        const accountID = await vault.totalAccountsCreated();
        await vault.connect(user).openAccount();
        await collateralToken.connect(user).approve(vault.address, firstDeposit);
        await vault.connect(user).deposit(accountID, firstDeposit)
        await vault.connect(user).borrow(accountID, PRINCIPAL_AMOUNT)
        const oneYearInSeconds = 31536000;
        const oneYearInTheFuture = Math.round(Date.now() / 1000) + oneYearInSeconds;
        const timestamp = Number(oneYearInTheFuture);
        const date = new Date(timestamp * 1000);
        await hardon.setTimestamp(date);
        await vault.compoundInterest();

        const PAtoNumber = Number(formatUnits(PRINCIPAL_AMOUNT, 18))
        const interesttoInteger = Number(formatUnits(INTEREST_RATE, 18))

        const compoundInterest = calculateCompoundInterest(PAtoNumber, interesttoInteger, oneYearInSeconds, oneYearInSeconds)
        const principalAmount = await vault.principalAmount(accountID);
        expect(principalAmount).to.be.closeTo(parseEther(`${compoundInterest}`), parseUnits("1", 12));
    });

    it("Should return APY (compounded return)", async () => {
        const interest = 1
        const INTEREST_RATE = parseUnits(`${interest}`, 18);
        const { market: vault } = await setupTest({ interestRate: INTEREST_RATE });
        const oneYearInSeconds = 31536000;
        const expectedCompound = calculateCompoundInterest(1, interest, oneYearInSeconds, oneYearInSeconds);
        expect(await vault.APY()).to.be.closeTo(parseEther(`${expectedCompound - 1}`), parseUnits("1", 12))
    })

    it("Should return APR", async () => {
        const interest = 1
        const INTEREST_RATE = parseUnits(`${interest}`, 18);
        const { market: vault } = await setupTest({ interestRate: INTEREST_RATE });
        expect(await vault.APR()).to.be.closeTo(parseEther(`${interest}`), parseUnits("1", 8))
    })

})