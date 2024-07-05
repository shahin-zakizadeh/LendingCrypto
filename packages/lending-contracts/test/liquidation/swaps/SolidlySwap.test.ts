import hre, { ethers, hardon } from "hardhat";
import { expect } from "chai";
import { ERC20__factory } from "../../../typechain-types";
import { parseEther, parseUnits, formatUnits } from "ethers/lib/utils";
import {utils} from "ethers";

type SetupFixtureOptions = {

}

describe("SolidlySwap", function () {
    const setUpTest = hre.deployments.createFixture(async (hre, options?: SetupFixtureOptions) => {
        await hre.deployments.fixture();
        await hardon.fork("fantom", 58437785);
        const swapFactory = await ethers.getContractFactory("SolidlySwapExt");
        const swap = await swapFactory.deploy();
        const daiHolder = await hardon.impersonate(hardon.getExternalAddress("DAI_WHALE"))
        const dai = ERC20__factory.connect(hardon.getExternalAddress("DAI"), daiHolder);
        await dai.transfer(swap.address, await dai.balanceOf(daiHolder.address));
        const wftm = ERC20__factory.connect(hardon.getExternalAddress("WFTM"), daiHolder);
        return { swap, dai, wftm }
    })

    it("Should swap", async () => {
        const { swap, dai, wftm } = await setUpTest();
        const routerAddress = hardon.getExternalAddress("EQ_ROUTER");
        const route = [
            {
                from: hardon.getExternalAddress("DAI"),
                to: hardon.getExternalAddress("USDC"),
                stable: true
            },
            {
                from: hardon.getExternalAddress("USDC"),
                to: hardon.getExternalAddress("WFTM"),
                stable: false
            }
        ]
        const swapData = utils.defaultAbiCoder.encode(["address", "tuple(address from, address to, bool stable)[]"], [routerAddress, route])
        await swap.swap(dai.address, parseEther("1"), parseEther("2"), swapData);
        expect(await wftm.balanceOf(swap.address)).greaterThan(0)
    })
})