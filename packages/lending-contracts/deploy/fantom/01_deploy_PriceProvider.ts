import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { FANTOM_SETUP } from '../../utils/deployments-tags';
import { NULL_ADDRESS } from '../../utils/constants';

export const PRICE_PROVIDER_DID = 'price_provider';
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();

    const BASE_TOKEN_ADDRESS = NULL_ADDRESS

    await deploy(PRICE_PROVIDER_DID, {
        from: deployer,
        contract: 'PriceProvider',
        args: [BASE_TOKEN_ADDRESS, 18],
        log: true,
    });
};
func.id = PRICE_PROVIDER_DID;
func.tags = [PRICE_PROVIDER_DID, FANTOM_SETUP]
export default func;
