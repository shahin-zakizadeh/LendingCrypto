import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { CHAINLINK_PRICE_ORACLE_DID } from './02_deploy_ChainlinkPriceOracle';
import { PRICE_PROVIDER_DID } from './01_deploy_PriceProvider';
import { FANTOM_SETUP } from '../../utils/deployments-tags';
import { exec } from "@lenclub/hardon"

export const CONFIGURE_PRICE_PROVIDER_DID = 'configure_PriceProvider';

const configurePriceProvider: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, ethers, hardon } = hre;
    const priceProviderDeployment = await deployments.get(PRICE_PROVIDER_DID);
    const chainlinkPriceOracleDeployment = await deployments.get(CHAINLINK_PRICE_ORACLE_DID);

    const priceProvider = await ethers.getContractAt('PriceProvider', priceProviderDeployment.address);
    const chainlinkPriceOracle = await ethers.getContractAt('ChainlinkPriceOracle', chainlinkPriceOracleDeployment.address);
    
    const FTM_ADDRESS = hardon.getExternalAddress("WFTM");
    const USDC_ADDRESS = hardon.getExternalAddress("USDC");

    const ftmAlreadyConfigured = await priceProvider.priceOracle(FTM_ADDRESS) === chainlinkPriceOracle.address;
    if (!ftmAlreadyConfigured) {
        await exec(() => priceProvider.setTokenOracle(FTM_ADDRESS, chainlinkPriceOracle.address));
    }
    const usdcAlreadyConfigured = await priceProvider.priceOracle(USDC_ADDRESS) === chainlinkPriceOracle.address;
    if (!usdcAlreadyConfigured) {
        await exec(() => priceProvider.setTokenOracle(USDC_ADDRESS, chainlinkPriceOracle.address));
    }

};

configurePriceProvider.dependencies = [CHAINLINK_PRICE_ORACLE_DID, PRICE_PROVIDER_DID]
export default configurePriceProvider;
configurePriceProvider.id = CONFIGURE_PRICE_PROVIDER_DID;
configurePriceProvider.tags = [CONFIGURE_PRICE_PROVIDER_DID, FANTOM_SETUP];
