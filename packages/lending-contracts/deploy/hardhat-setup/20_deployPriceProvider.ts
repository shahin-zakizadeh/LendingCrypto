import { DeployFunction } from 'hardhat-deploy/dist/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { HARDHAT_SETUP } from '../../utils/deployments-tags';

export const MOCK_PRICE_PROVIDER = 'mock_price_provider';

const deployPriceProvider: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployer } = await hre.getNamedAccounts();
  const deployment = await hre.deployments.deploy(MOCK_PRICE_PROVIDER, {
    from: deployer,
    contract: 'MockPriceProvider',
    args: [8],
  });
};

export default deployPriceProvider;
deployPriceProvider.id = MOCK_PRICE_PROVIDER;
deployPriceProvider.tags = [MOCK_PRICE_PROVIDER, HARDHAT_SETUP];