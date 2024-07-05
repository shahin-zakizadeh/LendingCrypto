import { DeployFunction } from 'hardhat-deploy/dist/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { HARDHAT_SETUP } from '../../utils/deployments-tags';

export const MOCK_STABLE_DID = 'mock_stable_coin';

const deployMockStablecoin: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployer } = await hre.getNamedAccounts();
  const deployment = await hre.deployments.deploy(MOCK_STABLE_DID, {
    from: deployer,
    contract: 'MockToken',
    args: [18, "MockUSD", "mUSD"],
  });
};
export default deployMockStablecoin;
deployMockStablecoin.id = MOCK_STABLE_DID;
deployMockStablecoin.tags = [MOCK_STABLE_DID, HARDHAT_SETUP];