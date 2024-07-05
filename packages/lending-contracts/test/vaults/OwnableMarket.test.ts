import hre, { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { parseUnits } from "ethers/lib/utils";
import { BigNumberish, BigNumber, constants } from "ethers";
import { WITHDRAW_HR_BELOW_ONE, NOT_BELOW_MINIMUM_COLLATERAL_PERCENTAGE, NOT_ENOUGH_COLLATERAL, ONLY_VAULT_OWNER, VAULT_NOT_EXIST, BORROW_HR_BELOW_ONE, LIQUIDATION_TOO_MUCH, LIQUIDATION_CANNOT_LEAVE_SMALL_DEBT, LIQUIDATION_LIQUIDATE_ENTIRE_SMALL_ACCOUNT } from "../helpers/errors";
import { ContractFactory } from 'ethers';
import { CALLER_IS_NOT_ADMINISTRATOR } from "../helpers/errors";
import { OwnableMarket } from "../../typechain-types";


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

describe("OwnableMarket", function () {
  let ownableMarket: OwnableMarket;
  let deployer: SignerWithAddress;
  let user: SignerWithAddress;
  let deployer2: SignerWithAddress;

  const setupTest = hre.deployments.createFixture(async (hre, options: SetupFixtureOptions | undefined) => {

    const OwnableMarket = await ethers.getContractFactory("OwnableMarket");
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
    const ADMIN_ROLE_DEFULT = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN_ROLE"));

    ownableMarket = await OwnableMarket.deploy(
      priceProvider.address,
      liquidationThreshold,
      name,
      symbol,
      collateralToken.address,
      debtToken.address,
      baseURI,
      options?.liquidationMaxHR ?? constants.MaxUint256,
      options?.liquidationPenalty ?? "1100",
      options?.closingFee ?? 0
    );
    // await ownableMarket.deployed();
    return { debtToken, collateralToken, priceProvider, ownableMarket };
  });

  this.beforeAll(async () => {
    ({ deployer } = await hre.hardon.getHardhatSigners());
    ([user] = await hre.hardon.getUnnamedSigners());

  })

  it("should revert if caller is not the administrator for setLiquidationPenalty", async () => {
    const { ownableMarket } = await setupTest();

    await expect(ownableMarket.connect(user).setLiquidationPenalty(100))
      .to.be.revertedWith(CALLER_IS_NOT_ADMINISTRATOR);
  });

  it("should not revert if caller is the administrator for setLiquidationPenalty", async () => {

    const { ownableMarket } = await setupTest();

    await expect(ownableMarket.connect(deployer).setLiquidationPenalty(100)).to.not.be.reverted;
    expect(await ownableMarket.liquidationPenalty()).to.equal(100);
  });

  it("should revert if caller is not the administrator for transferToken", async () => {

    const collateralAmount = 100;
    const { collateralToken, ownableMarket } = await setupTest();

    const initialBalance = await collateralToken.balanceOf(user.address);
    await expect(ownableMarket.connect(user).transferToken(user.address, collateralToken.address, collateralAmount))
      .to.be.revertedWith(CALLER_IS_NOT_ADMINISTRATOR);

    const finalBalance = await collateralToken.balanceOf(user.address);
    expect(finalBalance).to.equal(initialBalance);

  });

  it("should not revert if caller is the administrator for transferToken", async () => {

    const collateralAmount = 100;
    const { collateralToken, ownableMarket } = await setupTest();
    await collateralToken.mint(ownableMarket.address, collateralAmount);

    await expect(ownableMarket.connect(deployer).transferToken(user.address, collateralToken.address, collateralAmount)).to.not.be.reverted;
  });



  it("should revert if caller is not the administrator for changePriceProvider", async () => {

    const { ownableMarket } = await setupTest();
    const newPriceProvider = "0x0123456789abcdef0123456789abcdef01234567";

    await expect(ownableMarket.connect(user).changePriceProvider(newPriceProvider)).to.be.revertedWith(CALLER_IS_NOT_ADMINISTRATOR);


  });

  it("should not revert if caller is the administrator for changePriceProvider", async () => {

    const { ownableMarket } = await setupTest();
    const newPriceProvider = "0x0123456789abcDEF0123456789abCDef01234567";

    await expect(ownableMarket.connect(deployer).changePriceProvider(newPriceProvider)).to.not.be.reverted;

    const updatedPriceProvider = await ownableMarket.priceProvider();

    expect(updatedPriceProvider).to.equal(newPriceProvider);
  });

  it("should revert if caller is not the administrator for setLiquidationThreshold", async () => {
    const { ownableMarket } = await setupTest();

    await expect(ownableMarket.connect(user).setLiquidationThreshold(2))
      .to.be.revertedWith(CALLER_IS_NOT_ADMINISTRATOR);
  });

  it("should not revert if caller is the administrator for setLiquidationThreshold", async () => {
    const { ownableMarket } = await setupTest();
    const expectedThreshold = 2;

    await expect(ownableMarket.connect(deployer).setLiquidationThreshold(expectedThreshold)).to.not.be.reverted;

    const actualThreshold = await ownableMarket.liquidationThreshold();
    expect(actualThreshold).to.equal(expectedThreshold);
  });


  it("should revert if caller is not the administrator for setClosingFee", async () => {
    const { ownableMarket } = await setupTest();

    await expect(ownableMarket.connect(user).setClosingFee(2))
      .to.be.revertedWith(CALLER_IS_NOT_ADMINISTRATOR);
  });

  it("should not revert if caller is the administrator for setClosingFee", async () => {
    const { ownableMarket } = await setupTest();

    await expect(ownableMarket.connect(deployer).setClosingFee(2)).to.not.be.reverted;

    const closingFee = await ownableMarket.closingFee();
    expect(closingFee).to.equal(2);
  });



  it("should revert if caller is not the administrator for setTreasuryAccountId", async () => {
    const { ownableMarket } = await setupTest();

    await expect(ownableMarket.connect(user).setTreasuryAccountId(1))
      .to.be.revertedWith(CALLER_IS_NOT_ADMINISTRATOR);
  });

  it("should not revert if caller is the administrator for setTreasuryAccountId", async () => {
    const { ownableMarket } = await setupTest();
    const accountID = await ownableMarket.totalAccountsCreated();
    await ownableMarket.connect(user).openAccount();

    await expect(ownableMarket.connect(deployer).setTreasuryAccountId(accountID))
      .to.not.be.reverted;

    const newAccountID = await ownableMarket.treasuryAccountId();
    expect(newAccountID).to.equal(accountID);
  });

  it("should revert if caller is not the administrator for setBaseURI", async () => {
    const { ownableMarket } = await setupTest();
    const newBaseURI = "https://new.baseuri.com/";

    await expect(ownableMarket.connect(user).setBaseURI(newBaseURI)).to.be.revertedWith(CALLER_IS_NOT_ADMINISTRATOR);
  });

  it("should set the correct baseURI after a successful call to setBaseURI", async () => {
    const { ownableMarket } = await setupTest();
    const newBaseURI = "https://new.baseuri.com/";

    await expect(ownableMarket.connect(deployer).setBaseURI(newBaseURI)).to.not.be.reverted;
    expect(await ownableMarket.baseUri()).to.equal(newBaseURI);
  });

  it("should add administrator successfully", async () => {
    const { ownableMarket } = await setupTest();
    await expect(await ownableMarket.isAdmin(user.address)).to.equal(false);
    await expect(ownableMarket.connect(deployer).addAdmininstrator(user.address)).to.not.be.reverted;
    expect(await ownableMarket.isAdmin(user.address)).to.equal(true);
  })

  it("should revert if caller is not the administrator for addAdmininstrator", async () => {
    const { ownableMarket } = await setupTest();
    await expect(ownableMarket.connect(user).addAdmininstrator(user.address)).to.be.revertedWith(CALLER_IS_NOT_ADMINISTRATOR);
  })

  it("should remove administrator successfully", async () => {
    const { ownableMarket } = await setupTest();
    await expect(await ownableMarket.isAdmin(user.address)).to.equal(false);
    await expect(ownableMarket.connect(deployer).addAdmininstrator(user.address)).to.not.be.reverted;
    expect(await ownableMarket.isAdmin(user.address)).to.equal(true);
    await expect(ownableMarket.connect(deployer).removeAdmininstrator(user.address)).to.not.be.reverted;
    expect(await ownableMarket.isAdmin(user.address)).to.equal(false);
  })

  it("should revert if caller is not the administrator for removeAdmininstrator", async () => {
    const { ownableMarket } = await setupTest();
    await expect(ownableMarket.connect(user).removeAdmininstrator(user.address)).to.be.revertedWith(CALLER_IS_NOT_ADMINISTRATOR);
  })


  it("should emit the correct event when adding an administrator", async () => {
    const { ownableMarket } = await setupTest();
    await expect(ownableMarket.connect(deployer).addAdmininstrator(user.address))
      .to.emit(ownableMarket, "AdministratorAdded")
      .withArgs(user.address, deployer.address);
  });

  it("should emit the correct event when adding remove administrator", async () => {
    const { ownableMarket } = await setupTest();
    await expect(ownableMarket.connect(deployer).removeAdmininstrator(user.address))
      .to.emit(ownableMarket, "AdministratorRemoved")
      .withArgs(user.address, deployer.address);
  });

  it("should update small account threshold successfully", async () => {
    const { ownableMarket } = await setupTest();
    const newSmallAccountThreshold = 100;
    await expect(ownableMarket.connect(deployer).updateSmallAccountThreshold(newSmallAccountThreshold)).to.not.be.reverted;
    expect(await ownableMarket.smallAccountThreshold()).to.equal(newSmallAccountThreshold);
  });

  it("should revert if caller is not the administrator for updateSmallAccountThreshold", async () => {
    const { ownableMarket } = await setupTest();
    const newSmallAccountThreshold = 100;
    await expect(ownableMarket.connect(user).updateSmallAccountThreshold(newSmallAccountThreshold)).to.be.revertedWith(CALLER_IS_NOT_ADMINISTRATOR);
  });
});