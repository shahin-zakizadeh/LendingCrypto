import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { parseEther, parseUnits, formatUnits } from "ethers/lib/utils";
import { FANTOM_SETUP } from '../../utils/deployments-tags';
import { PRICE_PROVIDER_DID } from './01_deploy_PriceProvider';
import { CONFIGURE_CHAINLINK_DID } from './03_configure_ChainlinkPriceOracle';
import { CONFIGURE_PRICE_PROVIDER_DID } from './04_configure_PriceProvider';

export const FTM_USDC_MARKET_DID = 'ftm_usdc_market';
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, hardon } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const priceProvider = await deployments.get(PRICE_PROVIDER_DID);

    await deploy(FTM_USDC_MARKET_DID, {
        from: deployer,
        contract: 'SimpleInterestMarket',
        args: [
            priceProvider.address,
            parseEther("1.3"),
            "FTM-USDC Market",
            "FTM-USDC Account",
            hardon.getExternalAddress("WFTM"),
            hardon.getExternalAddress("USDC"),
            "",
            parseEther("1.25"),
            parseUnits("1.1", 3),
            0
        ],
        log: true,
    });
};
func.id = FTM_USDC_MARKET_DID
func.tags = [FTM_USDC_MARKET_DID, FANTOM_SETUP];
func.dependencies = [CONFIGURE_CHAINLINK_DID, CONFIGURE_PRICE_PROVIDER_DID];
export default func;
