import hre, { ethers, hardon } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { parseEther, parseUnits, formatUnits } from "ethers/lib/utils";
import { BigNumberish, BigNumber, constants } from "ethers";
import { CALLER_IS_NOT_ADMINISTRATOR, PRINCIPAL_AMOUNT_TOO_SMALL } from "../helpers/errors";
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
    gracePeriod?: BigNumberish;
}

const ONE_YEAR_IN_MS = 31536000000;

const applySimpleInterest = (pa: BigNumber, interestRate: BigNumber, msElapsed: number) => {
    const sElapsed = Math.ceil(msElapsed / 1000);
    const oneYear = Math.ceil(ONE_YEAR_IN_MS / 1000);
    return pa.mul(interestRate.mul(sElapsed).div(oneYear).add(parseEther("1"))).div(parseEther("1"))
}

describe("SimpleInterestMarket", function () {
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
        const marketFactory = await hre.ethers.getContractFactory("SimpleInterestMarket");// test connects to the BaseMarket contract

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
        await market.setInterestGracePeriod(options?.gracePeriod ?? 0);
        await market.updateSmallAccountThreshold(options?.smallAccountThreshold ?? 0);
        await debtToken.mint(market.address, options?.availableSupply ?? parseEther("10000"))
        await market.setDailyIssuanceLimit(parseEther("10000"))
        await time.increase(time.duration.days(1));
        return { debtToken, collateralToken, priceProvider, market: market, }
    })

    this.beforeAll(async () => {
        ({ deployer } = await hre.hardon.getHardhatSigners());
        ([user] = await hre.hardon.getUnnamedSigners());
    })

    describe("Interest", function () {
        it("Should compound interest", async () => {
            const INTEREST_RATE = parseUnits("0.01", 18);
            const { market } = await setupTest({ interestRate: INTEREST_RATE })
            const startIndex = await market.interestIndex();

            await time.increase(time.duration.years(1))
            await market.compoundInterest();

            const newInterestIndex = await market.interestIndex();
            expect(newInterestIndex).to.be.closeTo(applySimpleInterest(startIndex, INTEREST_RATE, ONE_YEAR_IN_MS), INTEREST_RATE.div(100))
        })

        it("Should compound index", async () => {
            const INTEREST_RATE = parseUnits("0.50", 18);
            const { market } = await setupTest({ interestRate: INTEREST_RATE })
            const startIndex = await market.interestIndex();

            await time.increase(time.duration.years(0.5))
            await market.compoundInterest();

            await time.increase(time.duration.years(0.5))
            await market.compoundInterest();

            const newInterestIndex = await market.interestIndex();
            const expectedIndex = applySimpleInterest(applySimpleInterest(startIndex, INTEREST_RATE, ONE_YEAR_IN_MS / 2), INTEREST_RATE, ONE_YEAR_IN_MS / 2)
            expect(newInterestIndex).to.be.closeTo(expectedIndex, INTEREST_RATE.div(100))
        })

        it("Should update the PA", async () => {
            const INTEREST_RATE = parseUnits("0.10", 18);
            const PRINCIPAL_AMOUNT = parseEther("1000");

            const { market, collateralToken } = await setupTest({ interestRate: INTEREST_RATE });
            const firstDeposit = parseEther("1000");
            await collateralToken.mint(user.address, firstDeposit);
            const accountID = await market.totalAccountsCreated();
            await market.connect(user).openAccount();
            await collateralToken.connect(user).approve(market.address, firstDeposit);
            await market.connect(user).deposit(accountID, firstDeposit)
            await market.connect(user).borrow(accountID, PRINCIPAL_AMOUNT)

            await time.increase(time.duration.years(1))
            await market.compoundInterest();

            let principalAmount = await market.principalAmount(accountID);
            const expectedPaAfterOneYear = applySimpleInterest(PRINCIPAL_AMOUNT, INTEREST_RATE, ONE_YEAR_IN_MS);
            expect(principalAmount).to.be.closeTo(expectedPaAfterOneYear, INTEREST_RATE.div(100));

            const newInterestRate = parseEther("0.2");
            await market.setInterestRate(newInterestRate);

            await time.increase(time.duration.years(2))
            await market.compoundInterest();

            principalAmount = await market.principalAmount(accountID);
            const finalPa = applySimpleInterest(expectedPaAfterOneYear, newInterestRate, ONE_YEAR_IN_MS * 2);
            expect(principalAmount).to.be.closeTo(finalPa, INTEREST_RATE.div(100));

        });

        it("Should return APR", async () => {
            const INTEREST_RATE = parseUnits("1", 18);
            const { market } = await setupTest({ interestRate: 0 });
            await market.setInterestRate(INTEREST_RATE);
            expect(await market.APR()).to.be.closeTo(INTEREST_RATE, 1e9)
        })

        it("Should set the interest grace period", async () => {
            const interestGracePeriod = 6000;
            const { market } = await setupTest();
            await market.setInterestGracePeriod(interestGracePeriod);
            expect(await market.getGracePeriod()).to.eq(interestGracePeriod);
        })

        it("Should factor interest without calling compound()", async () => {
            const INTEREST_RATE = parseUnits("0.10", 18);
            const PRINCIPAL_AMOUNT = parseEther("1000");

            const { market, collateralToken } = await setupTest({ interestRate: INTEREST_RATE });
            const firstDeposit = parseEther("1000");
            await collateralToken.mint(user.address, firstDeposit);
            const accountID = await market.totalAccountsCreated();
            await market.connect(user).openAccount();
            await collateralToken.connect(user).approve(market.address, firstDeposit);
            await market.connect(user).deposit(accountID, firstDeposit)
            await market.connect(user).borrow(accountID, PRINCIPAL_AMOUNT)

            await time.increase(time.duration.years(1))

            let principalAmount = await market.principalAmount(accountID);
            const expectedPaAfterOneYear = applySimpleInterest(PRINCIPAL_AMOUNT, INTEREST_RATE, ONE_YEAR_IN_MS);
            expect(principalAmount).to.be.closeTo(expectedPaAfterOneYear, INTEREST_RATE.div(100));
        })

    })

    describe("Access control", function () {
        it("Should only let owner update interest", async () => {
            const interestRate = parseEther("0.05");
            const { market } = await setupTest({ interestRate: interestRate });
            await expect(market.connect(user).setInterestRate(interestRate)).to.be.revertedWith(CALLER_IS_NOT_ADMINISTRATOR);
        })

        it("Should only let owner update grace period", async () => {
            const interestGracePeriod = 6000;
            const { market } = await setupTest();
            await expect(market.connect(user).setInterestGracePeriod(interestGracePeriod)).to.be.revertedWith(CALLER_IS_NOT_ADMINISTRATOR);;
        })
    })

    describe("User Loan", function () {
        it("Should add principal on top of previous principal and interest", async () => {
            const interestRate = parseEther("0.5");
            const smallAccountThreshold = parseEther("0");
            const { market, debtToken, collateralToken } = await setupTest({ interestRate, smallAccountThreshold });

            const accountID = await market.totalAccountsCreated();
            await market.connect(user).openAccount();

            const collateralAmount = parseEther("100");
            await collateralToken.mint(user.address, collateralAmount);
            await collateralToken.connect(user).approve(market.address, collateralAmount);
            await market.connect(user).deposit(accountID, collateralAmount)

            const firtBorrow = parseEther("15");
            await market.connect(user).borrow(accountID, firtBorrow);

            await time.increase(time.duration.years(1))

            const secondBorrow = parseEther("20");
            await market.connect(user).borrow(accountID, secondBorrow);

            const principal = await market.principalAmount(accountID);
            const expectedPrincipal = applySimpleInterest(firtBorrow, interestRate, ONE_YEAR_IN_MS).add(secondBorrow);

            expect(principal).to.closeTo(expectedPrincipal, expectedPrincipal.div(1000));

        })

        it("Should decrease the principalAmount amount by the amount repaid", async () => {
            const interestRate = parseEther("1");
            const smallAccountThreshold = parseEther("10");
            const { market, debtToken, collateralToken } = await setupTest({ interestRate, smallAccountThreshold });

            const initialDebtBalance = parseEther("5")
            await debtToken.mint(user.address, initialDebtBalance);

            const accountID = await market.totalAccountsCreated();
            await market.connect(user).openAccount();

            const collateralAmount = parseEther("100");
            await collateralToken.mint(user.address, collateralAmount);
            await collateralToken.connect(user).approve(market.address, collateralAmount);
            await market.connect(user).deposit(accountID, collateralAmount)

            const borrowedAmount = parseEther("50");
            await market.connect(user).borrow(accountID, borrowedAmount);

            await time.increase(time.duration.years(1))
            await market.compoundInterest();
            expect(await market.principalAmount(accountID)).gt(borrowedAmount);

            await time.increase(time.duration.years(1))

            await debtToken.connect(user).approve(market.address, borrowedAmount);
            await market.connect(user).repay(accountID, borrowedAmount);

            const interestAccrued = applySimpleInterest(
                applySimpleInterest(borrowedAmount, interestRate, ONE_YEAR_IN_MS),
                interestRate, ONE_YEAR_IN_MS)
                .sub(borrowedAmount);
            expect(await market.principalAmount(accountID)).to.closeTo(interestAccrued, interestAccrued.div(1000))
        });

        it("Should be able to repay fully within the grace period", async () => {
            const interestRate = parseEther("1");
            const smallAccountThreshold = parseEther("10");
            const gracePeriod = 100;
            const { market, debtToken, collateralToken } = await setupTest({ interestRate, smallAccountThreshold, gracePeriod });

            const accountID = await market.totalAccountsCreated();
            await market.connect(user).openAccount();

            const collateralAmount = parseEther("100");
            await collateralToken.mint(user.address, collateralAmount);
            await collateralToken.connect(user).approve(market.address, collateralAmount);
            await market.connect(user).deposit(accountID, collateralAmount)

            const borrowedAmount = parseEther("50");
            await market.connect(user).borrow(accountID, borrowedAmount);

            await time.increase(time.duration.seconds(gracePeriod - 10))
            await market.compoundInterest();
            expect(await market.principalAmount(accountID)).gt(borrowedAmount);

            await debtToken.connect(user).approve(market.address, borrowedAmount);
            await market.connect(user).repay(accountID, borrowedAmount);

            expect(await market.principalAmount(accountID)).to.eq(0)
        })

        it("Should not apply interest grace if the user has no interest", async () => {
            const interestRate = parseEther("1");
            const smallAccountThreshold = parseEther("10");
            const gracePeriod = 1000;
            const { market, debtToken, collateralToken } = await setupTest({ interestRate, smallAccountThreshold, gracePeriod });

            const accountID = await market.totalAccountsCreated();
            await market.connect(user).openAccount();
            await market.updateSmallAccountThreshold(0);

            const collateralAmount = parseEther("100");
            await collateralToken.mint(user.address, collateralAmount);
            await collateralToken.connect(user).approve(market.address, collateralAmount);
            await market.connect(user).deposit(accountID, collateralAmount)

            const borrowedAmount = parseUnits("100", await debtToken.decimals());
            await market.connect(user).borrow(accountID, borrowedAmount);
            const interestGraced = borrowedAmount
                .mul(interestRate.div(31536000).mul(gracePeriod))
                .div(parseEther("1"));
            const stolenAmount = interestGraced.mul(9).div(10)
            const repaidAmount = borrowedAmount.sub(stolenAmount);
            await debtToken.connect(user).approve(market.address, repaidAmount)
            await market.connect(user).repay(accountID, repaidAmount);

            expect(await market.principalAmount(accountID)).to.eq(stolenAmount)
        })

        it("Should revert if tx is not processed within the grace period", async () => {
            const interestRate = parseEther("1");
            const smallAccountThreshold = parseEther("10");
            const gracePeriod = 100;
            const { market, debtToken, collateralToken } = await setupTest({ interestRate, smallAccountThreshold, gracePeriod });

            const accountID = await market.totalAccountsCreated();
            await market.connect(user).openAccount();

            const collateralAmount = parseEther("100");
            await collateralToken.mint(user.address, collateralAmount);
            await collateralToken.connect(user).approve(market.address, collateralAmount);
            await market.connect(user).deposit(accountID, collateralAmount)

            const borrowedAmount = parseEther("50");
            await market.connect(user).borrow(accountID, borrowedAmount);

            await time.increase(time.duration.seconds(gracePeriod + 1))
            await market.compoundInterest();
            expect(await market.principalAmount(accountID)).gt(borrowedAmount);
            await debtToken.connect(user).approve(market.address, borrowedAmount);
            await expect(market.connect(user).repay(accountID, borrowedAmount)).to.be.revertedWith(PRINCIPAL_AMOUNT_TOO_SMALL)
        })
    })

    describe("Liquidation", function () {
        it("Should let liquidators liquidate accounts within grace period", async () => {
            const liquidationThreshold = parseEther("1.5");
            const gracePeriod = 100;
            const smallAccountThreshold = parseEther("10");
            const oracleDecimals = 8;
            const interestRate = parseEther("0.25");
            const { market, collateralToken, priceProvider, debtToken } = await setupTest({
                liquidationThreshold,
                gracePeriod,
                smallAccountThreshold,
                oracleDecimals,
                interestRate
            });

            const firstDeposit = parseEther("30");

            await collateralToken.mint(user.address, firstDeposit);
            const accountID = await market.totalAccountsCreated();
            await market.connect(user).openAccount();
            await collateralToken.connect(user).approve(market.address, firstDeposit);
            await market.connect(user).deposit(accountID, firstDeposit)

            const initialCollateralPrice = await market.getCollateralPrice()
            const maxPrincipalAmount = firstDeposit.mul(initialCollateralPrice).div(parseUnits("1", oracleDecimals)).mul(parseEther("1")).div(liquidationThreshold)
            await market.connect(user).borrow(accountID, maxPrincipalAmount);

            await time.increase(time.duration.seconds(gracePeriod - 10))
            await market.compoundInterest();
            expect(await market.principalAmount(accountID)).gt(maxPrincipalAmount);
            const newPrice = initialCollateralPrice.div(5).mul(4);
            await priceProvider.setSafePrice(collateralToken.address, newPrice)
            expect(await market.isLiquidatable(accountID)).to.true


            await debtToken.mint(deployer.address, maxPrincipalAmount);
            await debtToken.approve(market.address, maxPrincipalAmount);
            await market.liquidate(accountID, maxPrincipalAmount);

            expect(await market.principalAmount(accountID)).to.eq(0)
        })
    })

})