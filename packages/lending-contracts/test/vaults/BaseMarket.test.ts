import hre, { ethers, hardon } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { parseEther, parseUnits, formatUnits } from "ethers/lib/utils";
import { BigNumberish, BigNumber, constants } from "ethers";
import { WITHDRAW_HR_BELOW_ONE, NOT_BELOW_MINIMUM_COLLATERAL_PERCENTAGE, NOT_ENOUGH_COLLATERAL, ONLY_VAULT_OWNER, VAULT_NOT_EXIST, BORROW_HR_BELOW_ONE, LIQUIDATION_TOO_MUCH, LIQUIDATION_CANNOT_LEAVE_SMALL_DEBT, LIQUIDATION_LIQUIDATE_ENTIRE_SMALL_ACCOUNT, PRINCIPAL_AMOUNT_TOO_SMALL } from "../helpers/errors";
import { ContractFactory } from 'ethers';

type SetupFixtureOptions = {
    availableSupply?: BigNumberish;
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

describe('BaseMarket', function () {
    let deployer: SignerWithAddress;
    let user: SignerWithAddress;

    // TODO: add tests with different decimals value for oracle and collateral
    const setupTest = hre.deployments.createFixture(async (hre, options: SetupFixtureOptions | undefined) => {

        const ercFactory: ContractFactory = await hre.ethers.getContractFactory("MockToken");
        const debtToken = await ercFactory.deploy(18, "debt", "DEB")
        const collateralToken = await ercFactory.deploy(18, "collateral", "COL")
        const priceProviderFactory = await hre.ethers.getContractFactory("MockPriceProvider");
        const priceProvider = await priceProviderFactory.deploy(options?.oracleDecimals ?? 8)
        await priceProvider.setSafePrice(collateralToken.address, options?.oraclePriceAnswer ?? DEFAULT_PRICE_ANSWER)
        const marketFactory = await hre.ethers.getContractFactory("BaseMarket");// test connects to the BaseMarket contract

        // deploy parameters
        const liquidationThreshold = options?.liquidationThreshold ?? parseUnits("1.5", 18);
        const name = options?.name ?? "test-vault";
        const symbol = options?.symbol ?? "TV";
        const baseURI = options?.baseURI ?? "hello-world";
        const closingFee = options?.closingFee ?? parseUnits("0.03", 4);
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
            closingFee
        )
        await market.updateSmallAccountThreshold(options?.smallAccountThreshold ?? 0);
        await debtToken.mint(market.address, options?.availableSupply ?? parseEther("10000"))
        return { debtToken, collateralToken, priceProvider, market: market, }

    })

    this.beforeAll(async () => {
        ({ deployer } = await hre.hardon.getHardhatSigners());
        ([user] = await hre.hardon.getUnnamedSigners());
    })

    it("Should return maximum debt", async () => {
        const { debtToken, market: vault } = await setupTest()
        expect((await vault.getAvailableDebt())).to.eq((await debtToken.totalSupply()))
    })

    it("Should create vault", async () => {
        const { market: vault } = await setupTest();
        const totalAccountsCreated1 = (await vault.totalAccountsCreated());
        await vault.connect(user).openAccount();
        expect(await vault.exists(totalAccountsCreated1)).to.be.true;

        const totalAccountsCreated2 = (await vault.totalAccountsCreated())
        await vault.connect(user).openAccount();
        expect(await vault.exists(totalAccountsCreated2)).to.be.true;

        expect(totalAccountsCreated1).to.be.eq(totalAccountsCreated2.sub(1))
    })

    it("Should return the vault exists", async () => {
        const { market: vault } = await setupTest()
        const accountID = await vault.totalAccountsCreated()
        await vault.connect(user).openAccount()
        expect(await (vault.exists(accountID))).to.eq(true)
    })

    it("Should return the vault doesn't exists", async () => {
        const { market: vault } = await setupTest()
        const accountID = await vault.totalAccountsCreated()
        await vault.connect(user).openAccount()
        expect(await (vault.exists(accountID.add(1)))).to.eq(false)
    })

    it("Should return the closingFee", async () => {
        const closingFee = 50
        const { market: vault } = await setupTest({ closingFee })
        await vault.connect(user).openAccount()
        expect((await vault.closingFee())).to.eq((50))
    })

    /*
    Note: The default treasury account for this market is account 0,
    which is why two accounts need to be created to properly test the closingFee function.
    */
    it("Should transfer closingFee as collateral to the admin account when repaying", async () => {
        const { market, collateralToken, debtToken } = await setupTest();

        const [user2] = await hre.hardon.getUnnamedSigners();

        const closingFee = await market.closingFee();
        const collateralAmount = parseEther("9");
        const principalAmount = parseEther("5");
        const repaymentAmount = parseEther("2");

        await collateralToken.mint(user.address, collateralAmount);
        await collateralToken.connect(user).approve(market.address, collateralAmount);
        const accountID = await market.totalAccountsCreated();
        await market.connect(user).openAccount();
        await market.connect(user).deposit(accountID, collateralAmount);

        await collateralToken.mint(user2.address, collateralAmount);
        await collateralToken.connect(user2).approve(market.address, collateralAmount);
        const accountID2 = await market.totalAccountsCreated()
        await market.connect(user2).openAccount();
        await market.connect(user2).deposit(accountID2, collateralAmount);

        await market.connect(user2).borrow(accountID2, principalAmount);
        await debtToken.mint(user2.address, repaymentAmount);
        await debtToken.connect(user).approve(market.address, repaymentAmount);
        const treasuryBalanceBefore = await market.collateralAmount(accountID);
        await market.connect(user2).repay(accountID2, repaymentAmount);
        const treasuryBalanceAfter = await market.collateralAmount(accountID);

        const collateralPrice = await market.getCollateralPrice()
        const closingFeeAmount = repaymentAmount.mul(closingFee).div(10000);
        const expectedTreasuryBalance = closingFeeAmount.mul(BigNumber.from(10).pow(8)).div(collateralPrice) //closing fee collateral transferred
        const treasuryBalance = treasuryBalanceAfter.sub(treasuryBalanceBefore);

        expect(treasuryBalance).to.eq(expectedTreasuryBalance);
    })

    /* 
    Note: The default treasury account for this market is account 0,
    which is why two accounts need to be created to properly test the closingFee function.
    */
    it("Should transfer closingFee as collateral to the admin account when liquidating", async () => {
        const { market, collateralToken, debtToken, priceProvider } = await setupTest();

        const [user2] = await hre.hardon.getUnnamedSigners();

        const closingFee = await market.closingFee();
        const collateralAmount = parseEther("9");
        const principalAmount = parseEther("12");


        await collateralToken.mint(user.address, collateralAmount);
        await collateralToken.connect(user).approve(market.address, collateralAmount);
        const accountID = await market.totalAccountsCreated();
        await market.connect(user).openAccount();
        await market.connect(user).deposit(accountID, collateralAmount);

        await collateralToken.mint(user2.address, collateralAmount);
        await collateralToken.connect(user2).approve(market.address, collateralAmount);
        const accountID2 = await market.totalAccountsCreated()
        await market.connect(user2).openAccount();
        await market.connect(user2).deposit(accountID2, collateralAmount);

        await market.connect(user2).borrow(accountID2, principalAmount);
        await debtToken.mint(user2.address, principalAmount);
        await debtToken.connect(user).approve(market.address, principalAmount);
        const newPrice = parseUnits("1.9", 8);
        await priceProvider.setSafePrice(collateralToken.address, newPrice);
        const treasuryBalanceBefore = await market.collateralAmount(accountID);
        await market.connect(user).liquidate(accountID2, principalAmount);
        const treasuryBalanceAfter = await market.collateralAmount(accountID);

        const closingFeeAmount = principalAmount.mul(closingFee).div(10000);
        const expectedTreasuryBalance = closingFeeAmount.mul(BigNumber.from(10).pow(8)).div(newPrice) //closing fee collateral transferred
        const treasuryBalance = treasuryBalanceAfter.sub(treasuryBalanceBefore);

        expect(treasuryBalance).to.eq(expectedTreasuryBalance);
    })



    it("Should return the debt price", async () => {
        const { market: vault, priceProvider } = await setupTest()
        expect(await vault.getDebtPrice()).to.eq(10 ** await priceProvider.DECIMALS())
    })

    it("Should return collateral price", async () => {
        const { market: vault } = await setupTest();
        expect(await vault.getCollateralPrice()).to.eq(DEFAULT_PRICE_ANSWER)
    })

    describe("Deposit", function () {
        it("Should deposit collateral", async () => {

            const collateralAmount = parseEther("100")
            const { collateralToken, market: vault } = await setupTest()
            await collateralToken.mint(user.address, collateralAmount);
            await collateralToken.connect(user).approve(vault.address, collateralAmount);
            const accountID = await vault.totalAccountsCreated();
            await vault.connect(user).openAccount();
            await vault.connect(user).deposit(accountID, collateralAmount);
            expect(await vault.collateralAmount(accountID)).to.eq(collateralAmount);
            expect(await collateralToken.balanceOf(user.address)).to.eq(0)
            expect(await collateralToken.balanceOf(vault.address)).to.eq(collateralAmount)
        })

        it("Should add the deposited amount to the collateral balance", async () => {
            const collateralAmount1 = parseEther("1")
            const collateralAmount2 = parseEther("2")

            const { collateralToken, market: vault } = await setupTest()

            await collateralToken.mint(user.address, collateralAmount1.add(collateralAmount2));
            await collateralToken.connect(user).approve(vault.address, collateralAmount1.add(collateralAmount2));

            const accountID = await vault.totalAccountsCreated();
            await vault.connect(user).openAccount();

            await vault.connect(user).deposit(accountID, collateralAmount1)
            await vault.connect(user).deposit(accountID, collateralAmount2)

            expect(await vault.collateralAmount(accountID)).to.equal(collateralAmount1.add(collateralAmount2))
        })

        it("Should check other users can send deposit to other user's vault ", async () => {

            const [user1, user2] = await hre.hardon.getUnnamedSigners()

            const collateralAmount1 = parseEther("1")
            const collateralAmount2 = parseEther("2")

            const { collateralToken, market: vault } = await setupTest()
            await collateralToken.mint(user1.address, collateralAmount1);
            await collateralToken.mint(user2.address, collateralAmount2);
            await collateralToken.connect(user1).approve(vault.address, collateralAmount1);
            await collateralToken.connect(user2).approve(vault.address, collateralAmount2);

            const accountID = await vault.totalAccountsCreated();
            await vault.connect(user1).openAccount();

            await vault.connect(user1).deposit(accountID, collateralAmount1)
            await vault.connect(user2).deposit(accountID, collateralAmount2)

            expect(await vault.collateralAmount(accountID)).to.equal(collateralAmount1.add(collateralAmount2))

        })
    })

    describe("Withdraw", function () {
        it("Should decrease collateral and increase wallet ballance", async () => {
            const collateralAmount = parseEther("100")
            const { collateralToken, market: vault } = await setupTest()
            await collateralToken.mint(user.address, collateralAmount);
            await collateralToken.connect(user).
                approve(vault.address, collateralAmount);
            const accountID = await vault.totalAccountsCreated();
            await vault.connect(user).openAccount();
            await vault.connect(user).deposit(accountID, collateralAmount);
            await vault.connect(user).withdraw(accountID, collateralAmount);
            expect(await vault.collateralAmount(accountID)).to.eq(0);
            expect(await collateralToken.balanceOf(user.address)).to.eq(collateralAmount)
        })

        it("Should revert if caller is not the account owner", async () => {
            const [user1, user2] = await hre.hardon.getUnnamedSigners()
            const collateralAmount = parseEther("100")
            const { collateralToken, market: vault } = await setupTest()
            await collateralToken.mint(user1.address, collateralAmount);
            await collateralToken.connect(user1).approve(vault.address, collateralAmount);
            const accountID = await vault.totalAccountsCreated();
            await vault.connect(user1).openAccount();
            await vault.connect(user1).deposit(accountID, collateralAmount);
            await expect(vault.connect(user2).withdraw(accountID, collateralAmount)).to.be.revertedWith(ONLY_VAULT_OWNER)
        })

        it("Should not let user withdraw more than their account balance", async () => {
            const collateralAmount = parseEther("100")
            const { collateralToken, market: vault } = await setupTest()
            await collateralToken.mint(user.address, collateralAmount);
            await collateralToken.connect(user).approve(vault.address, collateralAmount);
            const accountID = await vault.totalAccountsCreated();
            await vault.connect(user).openAccount();
            await vault.connect(user).deposit(accountID, collateralAmount);
            await expect(vault.connect(user).withdraw(accountID, collateralAmount.add("1"))).to.be.revertedWith(NOT_ENOUGH_COLLATERAL)
        })

        it("Should not let user withdraw if his account health goes below 1 - 1gwei", async () => {
            const collateralAmount = parseEther("10")
            const collateralPrice = parseUnits("4", 8)
            const liquidationThreshold = parseUnits("1.2", 18)
            const { collateralToken, market: vault } = await setupTest({
                oraclePriceAnswer: collateralPrice,
                liquidationThreshold
            })
            await collateralToken.mint(user.address, collateralAmount);
            await collateralToken.connect(user).approve(vault.address, collateralAmount);
            const accountID = await vault.totalAccountsCreated();
            await vault.connect(user).openAccount();
            await vault.connect(user).deposit(accountID, collateralAmount);
            const borrowAmount = collateralAmount.mul(collateralPrice).div(10 ** 8).mul(parseEther("1")).div(liquidationThreshold);

            await vault.connect(user).borrow(accountID, borrowAmount)
            await expect(vault.connect(user).withdraw(accountID, 1)).to.be.revertedWith(WITHDRAW_HR_BELOW_ONE)
        })

        it("Should not let user withdraw if his account health goes below 1 - all", async () => {

            const collateralAmount = parseEther("10")
            const collateralPrice = parseUnits("4", 8)
            const liquidationThreshold = parseUnits("1.2", 18)
            const { collateralToken, market: vault } = await setupTest({
                oraclePriceAnswer: collateralPrice,
                liquidationThreshold
            })
            await collateralToken.mint(user.address, collateralAmount);
            await collateralToken.connect(user).approve(vault.address, collateralAmount);
            const accountID = await vault.totalAccountsCreated();
            await vault.connect(user).openAccount();
            await vault.connect(user).deposit(accountID, collateralAmount);
            const maxBorrow = collateralAmount.mul(collateralPrice).div(10 ** 8).mul(parseEther("1")).div(liquidationThreshold);
            await vault.connect(user).borrow(accountID, maxBorrow)
            await expect(vault.connect(user).withdraw(accountID, collateralAmount)).to.be.revertedWith(WITHDRAW_HR_BELOW_ONE)
        })

    })

    describe("Borrow", function () {
        it("Should borrow Token", async () => {
            const collateralAmount = parseEther("100")
            const debtAmount = parseEther("10")
            const { collateralToken, debtToken, market } = await setupTest()
            await collateralToken.mint(user.address, collateralAmount);
            await collateralToken.connect(user).approve(market.address, collateralAmount);
            const accountID = await market.totalAccountsCreated();
            await market.connect(user).openAccount();
            await market.connect(user).deposit(accountID, collateralAmount);

            await market.connect(user).borrow(accountID, debtAmount)
            expect(await market.principalAmount(accountID)).to.be.eq(debtAmount)

            const collateralValue = collateralAmount.mul(DEFAULT_PRICE_ANSWER).div(parseEther("1"))
            const debtValue = debtAmount.div(10 ** 10);
            const collateralValueFromContract = await market.calculateCollateralValue(collateralAmount)
            const debtValueFromContract = await market.calculatePrincipalValue(debtAmount)
            expect((collateralValue).div(debtValue)).to.eq(collateralValueFromContract.div(debtValueFromContract))
            expect(await debtToken.balanceOf(user.address)).to.eq(debtAmount);
        })

        it("Should not be able to borrow Token from other's vault", async () => {
            const collateralAmount = parseEther("100")
            const debtAmount = parseEther("1")
            const { collateralToken, market: vault } = await setupTest()
            await collateralToken.mint(user.address, collateralAmount);
            await collateralToken.connect(user).approve(vault.address, collateralAmount);
            const accountID = await vault.totalAccountsCreated();
            await vault.connect(user).openAccount();
            await vault.connect(user).deposit(accountID, collateralAmount);

            await expect(vault.borrow(accountID, debtAmount)).to.be.revertedWith(ONLY_VAULT_OWNER)
        })

        it("Should not be able to borrow to put his health ratio below 1", async () => {

            const collateralAmount = parseEther("5")
            const oracleDecimals = 8;
            const collateralPrice = parseUnits("2", oracleDecimals)
            const liquidationThreshold = parseUnits("1.2", 18)
            const { collateralToken, market: vault, debtToken } = await setupTest({
                oraclePriceAnswer: collateralPrice,
                oracleDecimals,
                liquidationThreshold
            })
            await collateralToken.mint(user.address, collateralAmount);
            await collateralToken.connect(user).approve(vault.address, collateralAmount);
            const accountID = await vault.totalAccountsCreated();
            await vault.connect(user).openAccount();
            await vault.connect(user).deposit(accountID, collateralAmount);
            const collateralValue = await vault.calculateCollateralValue(collateralAmount);
            const maxBorrowValue = collateralValue.mul(BigNumber.from("10").pow(await vault.LIQUIDATION_THRESHOLD_DECIMALS()))
                .div(liquidationThreshold)

            const decimalsMargin = await debtToken.decimals() - oracleDecimals
            const maxBorrowAmount = maxBorrowValue.mul(BigNumber.from("10").pow(decimalsMargin));

            await expect(vault.connect(user).borrow(accountID, maxBorrowAmount.add(BigNumber.from("10").pow(decimalsMargin + 1))))
                .to.be.revertedWith(BORROW_HR_BELOW_ONE)
        })

        it("should revert when borrowing an amount less than smallAccountThreshold", async () => {
            const { collateralToken, market } = await setupTest();
            const accountID = await market.totalAccountsCreated();
            await market.connect(user).openAccount();

            const smallAccountThreshold = parseEther("1000");
            await market.updateSmallAccountThreshold(smallAccountThreshold);

            const collateralAmount = parseEther("100");
            const borrowAmount = parseEther("10");
            await collateralToken.mint(user.address, collateralAmount);
            await collateralToken.connect(user).approve(market.address, collateralAmount);
            await market.connect(user).deposit(accountID, collateralAmount);
            await expect(market.connect(user).borrow(accountID, borrowAmount)).to.be.revertedWith(PRINCIPAL_AMOUNT_TOO_SMALL);
        });
    })

    describe("Repay", function () {

        it("Should ensure that the principalAmount amount has decreased by the amount repaid", async () => {
            const { market: vault, debtToken, collateralToken } = await setupTest();

            const initialDebtBalance = parseEther("5")
            await debtToken.mint(user.address, initialDebtBalance);

            const borrowedAmount = parseEther("1");
            const collateralAmount = parseEther("1");

            await collateralToken.mint(user.address, collateralAmount);
            await collateralToken.connect(user).approve(vault.address, collateralAmount);

            const accountID = await vault.totalAccountsCreated();
            await vault.connect(user).openAccount();
            await vault.connect(user).deposit(accountID, collateralAmount)
            await vault.connect(user).borrow(accountID, borrowedAmount);

            const amountToRepay = parseEther("1");
            await debtToken.connect(user).approve(vault.address, amountToRepay);
            await vault.connect(user).repay(accountID, amountToRepay);

            const finalBalance = await debtToken.balanceOf(user.address);
            expect(finalBalance).to.equal(initialDebtBalance.add(borrowedAmount).sub(amountToRepay));

            const finalDebt = await vault.principalAmount(accountID);
            expect(finalDebt).to.equal(borrowedAmount.sub(amountToRepay));
        });

        it("Should be able to repay principal fully", async () => {
            const smallAccountThreshold = parseEther("1")
            const { market, debtToken, collateralToken } = await setupTest({ smallAccountThreshold });

            const collateralAmount = parseEther("5");
            await collateralToken.mint(user.address, collateralAmount);
            await collateralToken.connect(user).approve(market.address, collateralAmount);

            const accountID = await market.totalAccountsCreated();
            await market.connect(user).openAccount();
            await market.connect(user).deposit(accountID, collateralAmount);

            const borrowedAmount = parseEther("2");
            await market.connect(user).borrow(accountID, borrowedAmount);

            await debtToken.connect(user).approve(market.address, borrowedAmount);
            await market.connect(user).repay(accountID, borrowedAmount);

            const finalPrincipal = await market.principalAmount(accountID);
            expect(finalPrincipal).to.equal(0);
        });

        it("should revert after repay if the outstanding principal is smaller than small account threshold", async () => {
            const { collateralToken, debtToken, market } = await setupTest();

            const accountID = await market.totalAccountsCreated();
            await market.connect(user).openAccount();

            const smallAccountThreshold = parseEther("1000");
            await market.updateSmallAccountThreshold(smallAccountThreshold);

            const collateralAmount = parseEther("2000");
            const borrowAmount = parseEther("1000");
            await collateralToken.mint(user.address, collateralAmount);
            await collateralToken.connect(user).approve(market.address, collateralAmount);
            await market.connect(user).deposit(accountID, collateralAmount);
            await market.connect(user).borrow(accountID, borrowAmount);

            // Repay an amount less than the small account threshold
            const repayAmount = parseEther("500");
            await debtToken.mint(user.address, repayAmount);
            await debtToken.connect(user).approve(market.address, repayAmount);

            await expect(market.connect(user).repay(accountID, repayAmount)).to.be.revertedWith(PRINCIPAL_AMOUNT_TOO_SMALL);
        });
    })

    describe("Liquidation", function () {
        const setUpLiquidation = async (
            collateralAmount: string,
            setUpOptions?: SetupFixtureOptions,
        ) => {
            const { market: vault, collateralToken, debtToken, priceProvider, ...rest } = await setupTest(setUpOptions);
            const [user, liquidator] = await hre.hardon.getUnnamedSigners()

            const accountID = await vault.totalAccountsCreated();
            await vault.connect(user).openAccount();

            const deposit = parseUnits(collateralAmount, await collateralToken.decimals());
            await collateralToken.mint(user.address, deposit);
            await collateralToken.connect(user).approve(vault.address, deposit);
            await vault.connect(user).deposit(accountID, deposit)

            const collateralValue = await vault.calculateCollateralValue(deposit);
            const liquidationThresholdDecimals = await vault.LIQUIDATION_THRESHOLD_DECIMALS();
            const liquidationThreshold = await vault.liquidationThreshold();
            const oracleDecimals = await priceProvider.DECIMALS()
            const maxBorrow = collateralValue
                .mul(BigNumber.from("10").pow(liquidationThresholdDecimals))
                .div(liquidationThreshold)
                .mul(BigNumber.from("10").pow(await debtToken.decimals() - oracleDecimals))

            const smallAccountThreshold = await vault.smallAccountThreshold()
            await vault.updateSmallAccountThreshold(0)
            await vault.connect(user).borrow(accountID, maxBorrow);
            await vault.updateSmallAccountThreshold(smallAccountThreshold)

            await debtToken.mint(liquidator.address, maxBorrow)

            return {
                user, liquidator,
                deposit,
                borrowed: maxBorrow,
                accountID,
                vault,
                collateralToken,
                debtToken,
                priceProvider,
                ...rest
            }
        }

        it("Should return the vault is not isLiquidatable if the account does not exists", async () => {
            const { market: vault } = await setupTest()
            const accountID = await vault.totalAccountsCreated()
            await vault.connect(user).openAccount()
            await expect(vault.isLiquidatable(accountID.add(1))).to.be.revertedWith(VAULT_NOT_EXIST)
        })

        it("Should calculate liquidator reward", async () => {
            const oracleDecimals = 9;
            const oraclePriceAnswer = parseUnits("3", oracleDecimals)
            const { market: vault } = await setupTest({
                oracleDecimals,
                oraclePriceAnswer,
            });
            const liquidationPenalty = await vault.liquidationPenalty();
            const liquidationPenaltyDecimals = await vault.LIQUIDATION_PENALTY_DECIMALS()
            const amountLiquidated = parseEther("10");
            const liquidatorReward = amountLiquidated.mul(liquidationPenalty).div(BigNumber.from("10").pow(liquidationPenaltyDecimals)).mul(10 ** oracleDecimals).div(oraclePriceAnswer)

            expect(await vault.calculateLiquidatorReward(amountLiquidated)).to.be.eq(liquidatorReward)
        })

        it("Should be liquidatable if collateral price drops", async () => {
            const { market: vault, collateralToken, priceProvider } = await setupTest();

            const firstDeposit = parseEther("30");
            const liquidationThreshold = await vault.liquidationThreshold()
            const initialCollateralPrice = await vault.getCollateralPrice()
            const debtAmountInitialPrice = firstDeposit.mul(initialCollateralPrice).div(BigNumber.from(10).pow(await priceProvider.DECIMALS())).mul(BigNumber.from(10).pow(await vault.LIQUIDATION_THRESHOLD_DECIMALS())).div(liquidationThreshold)
            await collateralToken.mint(user.address, firstDeposit);
            const accountID = await vault.totalAccountsCreated();
            await vault.connect(user).openAccount();
            await collateralToken.connect(user).approve(vault.address, firstDeposit);
            await vault.connect(user).deposit(accountID, firstDeposit)
            await vault.connect(user).borrow(accountID, debtAmountInitialPrice)
            const newPrice = initialCollateralPrice.sub(1);
            await priceProvider.setSafePrice(collateralToken.address, newPrice)
            expect(await vault.isLiquidatable(accountID)).to.true
        })

        it("Should not be liquidatable if collateral price does not drop", async () => {
            const { market: vault, collateralToken } = await setupTest();

            const firstDeposit = parseEther("30");
            const minCollateralPercentage = await vault.liquidationThreshold()
            const initialCollateralPrice = await vault.getCollateralPrice()
            const debtAmountInitialPrice = firstDeposit.mul(initialCollateralPrice).div(minCollateralPercentage).div(1e6)
            await collateralToken.mint(user.address, firstDeposit);
            const accountID = await vault.totalAccountsCreated();
            await vault.connect(user).openAccount();
            await collateralToken.connect(user).approve(vault.address, firstDeposit);
            await vault.connect(user).deposit(accountID, firstDeposit)
            await vault.connect(user).borrow(accountID, debtAmountInitialPrice)
            expect(await vault.isLiquidatable(accountID)).to.false
        })

        it("Should revert while liquidating - vault doesn't exist", async () => {
            const { market: vault } = await setupTest()
            const accountID = await vault.totalAccountsCreated()
            await expect(vault.liquidate(accountID.add(1), BigNumber.from("100"))).to.be.revertedWith(VAULT_NOT_EXIST)
        })

        it("Should return an error while liquidating - vault is not below 100%HR", async () => {

            const { market: vault, collateralToken } = await setupTest()
            const deposit = parseEther("10")
            await collateralToken.mint(user.address, deposit)
            const accountID = await vault.totalAccountsCreated()
            await vault.connect(user).openAccount()
            await collateralToken.connect(user).approve(vault.address, deposit)
            await vault.connect(user).deposit(accountID, deposit)
            const debtAmount = deposit.mul(await vault.getCollateralPrice()).div(await vault.liquidationThreshold()).div(1e6)
            await vault.connect(user).borrow(accountID, debtAmount)
            await expect(vault.liquidate(accountID, BigNumber.from("100"))).to.be.revertedWith(NOT_BELOW_MINIMUM_COLLATERAL_PERCENTAGE)
        })

        it("Should return an error while liquidating - token balance too low to pay off outstanding debt", async () => {

            const [user1, user2] = await hre.hardon.getUnnamedSigners()
            const { market: vault, collateralToken } = await setupTest()
            const deposit = parseEther("10")
            await collateralToken.mint(user1.address, deposit)
            const accountID = await vault.totalAccountsCreated()
            await vault.connect(user1).openAccount()
            await collateralToken.connect(user1).approve(vault.address, deposit)
            await vault.connect(user1).deposit(accountID, deposit)
            const debtAmount = deposit.mul(await vault.getCollateralPrice()).div(await vault.liquidationThreshold()).div(1e6)
            await vault.connect(user1).borrow(accountID, debtAmount)
            await collateralToken.transferFrom(user1.address, user2.address, await collateralToken.balanceOf(user1.address))
            await expect(vault.liquidate(accountID, BigNumber.from("100"))).to.be.revertedWith(NOT_BELOW_MINIMUM_COLLATERAL_PERCENTAGE)
        })

        it("Should liquidate", async () => {

            const liquidationThreshold = parseUnits("1.5", 18)
            const oracleDecimals = 8;
            const { priceProvider, vault, debtToken, collateralToken, accountID, liquidator, borrowed } = await setUpLiquidation(
                "100",
                { liquidationThreshold, oracleDecimals }
            )

            const newPrice = parseUnits("1.8", oracleDecimals);
            await priceProvider.setSafePrice(collateralToken.address, newPrice)

            expect(await vault.isLiquidatable(accountID)).to.be.true


            const collateralAmountbeforeLiq = await vault.collateralAmount(accountID)
            const LiquidatorRewardbeforeLiq = await vault.calculateLiquidatorReward(borrowed)

            await debtToken.connect(liquidator).approve(vault.address, borrowed)
            await vault.connect(liquidator).liquidate(accountID, borrowed)

            expect((await vault.principalAmount(accountID))).to.be.eq(0)

            expect(await vault.collateralAmount(accountID))
                .to.be.eq(collateralAmountbeforeLiq.sub(LiquidatorRewardbeforeLiq))

            expect(await vault.liquidatorRewards(liquidator.address)).to.be.eq(LiquidatorRewardbeforeLiq)
        })

        it("Liquidation should be limited to max HR", async () => {
            const liquidationThreshold = parseUnits("1.5", 18)
            const oracleDecimals = 8;
            const liquidationMaxHR = parseEther("1.2");
            const {
                deposit,
                priceProvider,
                vault,
                collateralToken,
                debtToken,
                accountID,
                liquidator,
                borrowed
            } = await setUpLiquidation("100", {
                liquidationThreshold,
                oracleDecimals,
                liquidationMaxHR,
                liquidationPenalty: 0 // the liquidator rewards reduce the collateral amount after liquidation
            })
            const newPrice = parseUnits("1.8", oracleDecimals);
            await priceProvider.setSafePrice(collateralToken.address, newPrice)

            expect(await vault.isLiquidatable(accountID)).to.be.true

            const collateralValue = await vault.calculateCollateralValue(deposit);
            const liquThresDecimals = await vault.LIQUIDATION_THRESHOLD_DECIMALS();
            const maxBorrowValue = collateralValue.mul(parseUnits("1", liquThresDecimals)).div(liquidationThreshold)
            const borrowForTargetHR = maxBorrowValue.mul(parseEther("1")).div(liquidationMaxHR);
            const maxLiquidation = borrowed.sub(borrowForTargetHR.mul(10 ** 10));

            await debtToken.connect(liquidator).approve(vault.address, maxLiquidation);
            await vault.connect(liquidator).liquidate(accountID, maxLiquidation);
            expect(await vault.calculateHealthRatio(accountID)).to.eq(liquidationMaxHR);
        })

        it("Liquidation should revert if HR is above the liquidation max HR", async () => {
            const liquidationThreshold = parseUnits("1.5", 18)
            const oracleDecimals = 8;
            const liquidationMaxHR = parseEther("1.2");
            const {
                deposit,
                priceProvider,
                vault,
                collateralToken,
                debtToken,
                accountID,
                liquidator,
                borrowed
            } = await setUpLiquidation("1000", {
                liquidationThreshold,
                oracleDecimals,
                liquidationMaxHR,
                liquidationPenalty: 0 // the liquidator rewards reduce the collateral amount after liquidation
            })

            const newPrice = parseUnits("1.8", oracleDecimals);
            await priceProvider.setSafePrice(collateralToken.address, newPrice)

            expect(await vault.isLiquidatable(accountID)).to.be.true

            const collateralValue = await vault.calculateCollateralValue(deposit);
            const liquThresDecimals = await vault.LIQUIDATION_THRESHOLD_DECIMALS();
            const maxBorrowValue = collateralValue.mul(parseUnits("1", liquThresDecimals)).div(liquidationThreshold)
            const borrowForTargetHR = maxBorrowValue.mul(parseEther("1")).div(liquidationMaxHR);
            const maxLiquidation = borrowed.sub(borrowForTargetHR.mul(10 ** 10));

            await debtToken.connect(liquidator).approve(vault.address, maxLiquidation.add(1));
            await expect(vault.connect(liquidator).liquidate(accountID, maxLiquidation.add(1))).to.be.revertedWith(LIQUIDATION_TOO_MUCH);
        })

        it("Liquidator can liquidate entire small accounts", async () => {
            const liquidationThreshold = parseUnits("1.5", 18)
            const oracleDecimals = 8;
            const liquidationMaxHR = parseEther("1.2");
            const smallAccountThreshold = parseUnits("10", 18)
            const {
                priceProvider,
                vault,
                collateralToken,
                debtToken,
                accountID,
                liquidator,
                borrowed
            } = await setUpLiquidation("5", {
                liquidationThreshold,
                oracleDecimals,
                liquidationMaxHR,
                smallAccountThreshold
            })
            const newPrice = parseUnits("1.8", oracleDecimals);
            await priceProvider.setSafePrice(collateralToken.address, newPrice)

            expect(await vault.isLiquidatable(accountID)).to.be.true
            expect(borrowed).lte(smallAccountThreshold);
            expect(await vault.isSmallAccount(accountID)).to.be.true;
            expect(await vault.principalAmount(accountID)).to.eq(borrowed);
            await debtToken.connect(liquidator).approve(vault.address, borrowed);
            await vault.connect(liquidator).liquidate(accountID, borrowed);
            expect(await vault.principalAmount(accountID)).to.eq(0);
            expect(await vault.calculateHealthRatio(accountID)).to.be.gt(liquidationMaxHR);
        })

        it("Liquidators have to liquidate small accounts entirely", async () => {
            const liquidationThreshold = parseUnits("1.5", 18)
            const oracleDecimals = 8;
            const liquidationMaxHR = parseEther("1.2");
            const smallAccountThreshold = parseUnits("10", 18)
            const {
                priceProvider,
                vault,
                collateralToken,
                debtToken,
                accountID,
                liquidator,
                borrowed
            } = await setUpLiquidation("5", {
                liquidationThreshold,
                oracleDecimals,
                liquidationMaxHR,
                smallAccountThreshold
            })
            const newPrice = parseUnits("1.8", oracleDecimals);
            await priceProvider.setSafePrice(collateralToken.address, newPrice)

            expect(await vault.isLiquidatable(accountID)).to.be.true
            expect(borrowed).lte(smallAccountThreshold);
            expect(await vault.principalAmount(accountID)).to.eq(borrowed);
            await debtToken.connect(liquidator).approve(vault.address, borrowed);
            await vault.updateSmallAccountThreshold(borrowed.add(1));
            expect(await vault.isSmallAccount(accountID)).to.be.true;
            await expect(vault.connect(liquidator).liquidate(accountID, borrowed.sub(1))).to.be.revertedWith(LIQUIDATION_LIQUIDATE_ENTIRE_SMALL_ACCOUNT);
        })

        it("Liquidators cannot leave less than small accounts", async () => {
            const liquidationThreshold = parseUnits("1.5", 18)
            const oracleDecimals = 8;
            const oraclePriceAnswer = parseUnits("2", oracleDecimals);
            const liquidationMaxHR = parseEther("1.2");
            const smallAccountThreshold = parseEther("10");
            //calculating a deposit amount so the borrow amount will be between a small and big amount
            const mediumDeposit = smallAccountThreshold.mul(3).div(2).mul(liquidationThreshold).div(BigNumber.from("10").pow(18)).mul(10 ** oracleDecimals).div(oraclePriceAnswer)
            const {
                priceProvider,
                vault,
                collateralToken,
                debtToken,
                accountID,
                liquidator,
                borrowed
            } = await setUpLiquidation(formatUnits(mediumDeposit.add(1), 18), {
                liquidationThreshold,
                oracleDecimals,
                oraclePriceAnswer,
                liquidationMaxHR,
                smallAccountThreshold
            })
            const newPrice = parseUnits("1.8", oracleDecimals);
            await priceProvider.setSafePrice(collateralToken.address, newPrice)

            expect(await vault.isLiquidatable(accountID)).to.be.true

            expect(await vault.isMediumAccount(accountID)).to.be.true;

            await debtToken.connect(liquidator).approve(vault.address, borrowed);
            await expect(vault.connect(liquidator).liquidate(accountID, borrowed.sub(1))).to.be.revertedWith(LIQUIDATION_CANNOT_LEAVE_SMALL_DEBT);
        })

        it("Liquidator can liquidate medium accounts entirely", async () => {
            const liquidationThreshold = parseUnits("1.5", 18)
            const oracleDecimals = 8;
            const oraclePriceAnswer = parseUnits("2", oracleDecimals);
            const liquidationMaxHR = parseEther("1.2");
            const smallAccountThreshold = parseEther("10");
            const mediumDeposit = smallAccountThreshold.mul(3).div(2).mul(liquidationThreshold).div(parseEther("1")).mul(parseUnits("1", oracleDecimals)).div(oraclePriceAnswer)
            const {
                priceProvider,
                vault,
                collateralToken,
                debtToken,
                accountID,
                liquidator,
                borrowed
            } = await setUpLiquidation(formatUnits(mediumDeposit, 18), {
                liquidationThreshold,
                oracleDecimals,
                oraclePriceAnswer,
                liquidationMaxHR,
                smallAccountThreshold
            })
            const newPrice = parseUnits("1.8", oracleDecimals);
            await priceProvider.setSafePrice(collateralToken.address, newPrice)

            expect(await vault.isLiquidatable(accountID)).to.be.true;
            expect(await vault.isSmallAccount(accountID)).to.be.false;
            expect(await vault.isMediumAccount(accountID)).to.be.true;

            await debtToken.connect(liquidator).approve(vault.address, borrowed);
            await vault.connect(liquidator).liquidate(accountID, borrowed);
            expect(await vault.principalAmount(accountID)).to.eq(0);
            expect(await vault.calculateHealthRatio(accountID)).to.be.gt(liquidationMaxHR);
        })

    })

    it("Should calculate the collateral value", async () => {
        const decimals = 18;
        const price = parseUnits("20", decimals);
        const { market: vault, collateralToken } = await setupTest({ oraclePriceAnswer: price, oracleDecimals: decimals });

        const collateralDecimals = await collateralToken.decimals();
        const collateralAmount = parseUnits("10", collateralDecimals);
        expect(await vault.calculateCollateralValue(collateralAmount)).to.eq(price.mul(collateralAmount).div(parseUnits("1", collateralDecimals)));

    })

    it("Should calculate the debt value", async () => {
        const decimals = 8;
        const price = parseUnits("1", decimals);
        const { market: vault, debtToken } = await setupTest();
        const debtDecimals = await debtToken.decimals();
        const debtAmount = parseUnits("10", debtDecimals);
        expect(await vault.calculatePrincipalValue(debtAmount)).to.eq(price.mul(debtAmount).div(parseUnits("1", debtDecimals)))
    })

    it("Should return an health ratio with 18 decimals", async () => {
        const collateralPriceDecimals = 8;
        const collateralPrice = parseUnits("20", collateralPriceDecimals);
        const liquidationThresholdDecimals = 18;
        const liquidationThreshold = parseUnits("1.2", liquidationThresholdDecimals);
        const { market: vault, collateralToken, debtToken } = await setupTest({
            oraclePriceAnswer: collateralPrice,
            oracleDecimals: collateralPriceDecimals,
            liquidationThreshold
        });
        const collateralDecimals = await collateralToken.decimals();
        const collateralAmount = parseUnits("10", collateralDecimals);
        const accountID = await vault.totalAccountsCreated();


        await vault.connect(user).openAccount();
        await collateralToken.mint(user.address, collateralAmount);
        await collateralToken.connect(user).approve(vault.address, collateralAmount);
        await vault.connect(user).deposit(accountID, collateralAmount);

        const debtPriceDecimals = 8;
        const debtPrice = parseUnits("1", debtPriceDecimals);

        var targetHealthRatio = "2";
        const debtAmount = collateralAmount.mul(collateralPrice).mul(BigNumber.from(10).pow(liquidationThresholdDecimals)).div(liquidationThreshold).div(targetHealthRatio).div(debtPrice)
        await vault.connect(user).borrow(accountID, debtAmount);

        expect((await vault.calculateHealthRatio(accountID))).to.be.closeTo(parseUnits(targetHealthRatio, 18), 10 ** (8))

    })

    it("Health Ratio Should return biggest value possible if no debt", async () => {
        const { market: vault, collateralToken } = await setupTest();
        const collateralDecimals = await collateralToken.decimals();
        const collateralAmount = parseUnits("10", collateralDecimals);
        const accountID = await vault.totalAccountsCreated();

        await vault.connect(user).openAccount();
        await collateralToken.mint(user.address, collateralAmount);
        await collateralToken.connect(user).approve(vault.address, collateralAmount);
        await vault.connect(user).deposit(accountID, collateralAmount);
        expect(await vault.calculateHealthRatio(accountID)).to.eq(ethers.constants.MaxUint256)
    })
})