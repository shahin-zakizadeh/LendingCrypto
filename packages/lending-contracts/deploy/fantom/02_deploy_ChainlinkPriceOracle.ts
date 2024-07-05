import { DeployFunction } from 'hardhat-deploy/types';
import { NULL_ADDRESS } from '../../utils/constants';
import { FANTOM_SETUP } from '../../utils/deployments-tags';
import { PRICE_PROVIDER_DID } from './01_deploy_PriceProvider';

export const CHAINLINK_PRICE_ORACLE_DID = 'chainlink_price_oracle';

const deployChainlinkPriceOracle: DeployFunction = async (hre) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy, get } = deployments;
    const { deployer } = await getNamedAccounts();

    const provider = await get(PRICE_PROVIDER_DID);
    const basePriceFeedAddress = NULL_ADDRESS;
    const deployment = await deploy(CHAINLINK_PRICE_ORACLE_DID, {
        from: deployer,
        contract: 'ChainlinkPriceOracle',
        args: [provider.address, basePriceFeedAddress],
        log: true,
    });
};

export default deployChainlinkPriceOracle;
deployChainlinkPriceOracle.dependencies = [PRICE_PROVIDER_DID]
deployChainlinkPriceOracle.id = CHAINLINK_PRICE_ORACLE_DID;
deployChainlinkPriceOracle.tags = [CHAINLINK_PRICE_ORACLE_DID, FANTOM_SETUP];
