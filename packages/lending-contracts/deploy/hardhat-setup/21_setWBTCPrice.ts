import { DeployFunction } from 'hardhat-deploy/dist/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { HARDHAT_SETUP } from '../../utils/deployments-tags';
import { MockPriceProvider__factory } from '../../typechain-types';
import { exec } from "@lenclub/hardon";
import { MOCK_PRICE_PROVIDER } from './20_deployPriceProvider';
import { MOCK_WBTC_DID } from './11_deployCollateral';
import { parseUnits } from "ethers/lib/utils";

export const PRICE_PROVIDER_SET_PRICE = 'price_provider_set_price';

const setWBTCPrice: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployer } = await hre.hardon.getHardhatSigners();
  const priceProviderDeployment = await hre.deployments.get(MOCK_PRICE_PROVIDER);
  const WBTC = await hre.deployments.get(MOCK_WBTC_DID);
  const priceProvider = MockPriceProvider__factory.connect(priceProviderDeployment.address, deployer);
  const decimals = await priceProvider.DECIMALS();
  await exec(() => priceProvider.setSafePrice(WBTC.address, parseUnits("98", decimals)));
};


setWBTCPrice.id = PRICE_PROVIDER_SET_PRICE;
setWBTCPrice.tags = [PRICE_PROVIDER_SET_PRICE, HARDHAT_SETUP];
setWBTCPrice.dependencies = [MOCK_PRICE_PROVIDER, MOCK_WBTC_DID]
export default setWBTCPrice;