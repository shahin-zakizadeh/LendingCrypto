import hre, { ethers, hardon } from "hardhat";
import { expect } from "chai";
import { ERC20__factory } from "../../../typechain-types";
import { parseEther, parseUnits, formatUnits } from "ethers/lib/utils";

type SetupFixtureOptions = {

}

describe("SolidlyFlashloans", function () {
    const setUpTest = hre.deployments.createFixture(async (hre, options?: SetupFixtureOptions) => {
        await hre.deployments.fixture();
        await hardon.fork("fantom", 58437785);
        const flashloanFactory = await ethers.getContractFactory("SolidlyFlashLoanTest");

        const flashloan = await flashloanFactory.deploy(
            hardon.getExternalAddress("EQ_PAIR_FACTORY"),
            hardon.getExternalAddress("EQ_vDAI_WFTM")
        );
        const daiHolder = await hardon.impersonate(hardon.getExternalAddress("DAI_WHALE"))
        const dai = ERC20__factory.connect(hardon.getExternalAddress("DAI"), daiHolder);
        await dai.transfer(flashloan.address, await dai.balanceOf(daiHolder.address));
        const wftm = ERC20__factory.connect(hardon.getExternalAddress("WFTM"), daiHolder);
        return { flashloan, dai, wftm }
    })

    it("Should swap", async () => {
        const { flashloan, dai, wftm } = await setUpTest();
        await expect(flashloan.flash(dai.address, parseEther("10"), "0x1100")).to.not.be.reverted;
    })
})