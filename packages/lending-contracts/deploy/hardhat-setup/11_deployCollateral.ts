import { DeployFunction } from 'hardhat-deploy/dist/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { HARDHAT_SETUP } from '../../utils/deployments-tags';

export const MOCK_WBTC_DID = 'mock_wbtc_coin';

const deployMockCollateral: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployer } = await hre.getNamedAccounts();
  const deployment = await hre.deployments.deploy(MOCK_WBTC_DID, {
    from: deployer,
    contract: 'MockToken',
    args: [18, "Wrapped Bitcoin", "wBTC"],
  });
};
export default deployMockCollateral;
deployMockCollateral.id = MOCK_WBTC_DID;
deployMockCollateral.tags = [MOCK_WBTC_DID, HARDHAT_SETUP];