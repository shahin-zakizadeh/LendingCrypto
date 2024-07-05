
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { FANTOM_SETUP } from '../../../utils/deployments-tags';

export const EQ_FTM_USDC_LIQ_DID = 'eq_ftm_usdc_liqu';
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();

    const vUSDC_FTM_PAIR = "0x7547d05dFf1DA6B4A2eBB3f0833aFE3C62ABD9a1"
    await deploy(EQ_FTM_USDC_LIQ_DID, {
        from: deployer,
        contract: 'SimpleSolidlyLiqu',
        args: [
            hre.hardon.getExternalAddress("TREASURY"), 
            hre.hardon.getExternalAddress("EQ_PAIR_FACTORY"), 
            vUSDC_FTM_PAIR
        ],
        log: true,
    });
};
func.id = EQ_FTM_USDC_LIQ_DID;
func.tags = [EQ_FTM_USDC_LIQ_DID, FANTOM_SETUP]
export default func;
