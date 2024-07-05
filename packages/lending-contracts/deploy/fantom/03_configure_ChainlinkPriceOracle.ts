// packages/lending-contracts/deploy/fantom/03_configure_ChainlinkPriceOracle.ts

import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NULL_ADDRESS } from "../../utils/constants";
import { FANTOM_SETUP } from "../../utils/deployments-tags";
import { CHAINLINK_PRICE_ORACLE_DID } from "./02_deploy_ChainlinkPriceOracle";
import { exec } from "@lenclub/hardon"

export const CONFIGURE_CHAINLINK_DID = 'configure_chainlink';
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, ethers } = hre;
    const { deployer: deployerAddress } = await getNamedAccounts();

    const chainlinkPriceOracleDeployment = await deployments.get(CHAINLINK_PRICE_ORACLE_DID);
    const deployer = await ethers.getSigner(deployerAddress);
    const chainlinkPriceOracle = await ethers.getContractAt(
        "ChainlinkPriceOracle",
        chainlinkPriceOracleDeployment.address,
        deployer
    );

    const FTM = hre.hardon.getExternalAddress('WFTM');
    if (await chainlinkPriceOracle.priceFeed(FTM) === NULL_ADDRESS) {
        await exec(() => chainlinkPriceOracle.setPriceFeed(FTM, hre.hardon.getExternalAddress('CL_FTM_FEED')));
    }
    const USDC = hre.hardon.getExternalAddress('USDC');
    if (await chainlinkPriceOracle.priceFeed(USDC) === NULL_ADDRESS) {
        await exec(() => chainlinkPriceOracle.setPriceFeed(USDC, hre.hardon.getExternalAddress('CL_USDC_FEED')));
    }
};

func.id = CONFIGURE_CHAINLINK_DID
func.tags = [CONFIGURE_CHAINLINK_DID, FANTOM_SETUP];
func.dependencies = [CHAINLINK_PRICE_ORACLE_DID];
export default func;
