import { DeployFunction } from 'hardhat-deploy/dist/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { constants } from 'ethers';
import { parseUnits } from "ethers/lib/utils";
import { MOCK_PRICE_PROVIDER } from './20_deployPriceProvider';
import { MOCK_STABLE_DID } from './10_deployStable';
import { MOCK_WBTC_DID } from './11_deployCollateral';
import { PRICE_PROVIDER_SET_PRICE } from './21_setWBTCPrice';
import { exec } from '@lenclub/hardon';

export const MOCK_WBTC_MARKET_DID = 'mock_wbtc_market';

const deployWBTCMarket: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployer } = await hre.getNamedAccounts();
  const priceProvider = await hre.deployments.get(MOCK_PRICE_PROVIDER);
  const stablecoin = await hre.deployments.get(MOCK_STABLE_DID);
  const collateral = await hre.deployments.get(MOCK_WBTC_DID);
  const deployment = await hre.deployments.deploy(MOCK_WBTC_MARKET_DID, {
    from: deployer,
    contract: 'SimpleInterestMarket',
    args: [
      priceProvider.address,
      parseUnits("1.5", 18),
      "Collateral Vault",
      "CV",
      stablecoin.address,
      collateral.address,
      "baseuri",
      constants.MaxUint256,
      1100,
      0
    ],
  });
};

export default deployWBTCMarket;
deployWBTCMarket.id = MOCK_WBTC_MARKET_DID;
deployWBTCMarket.tags = [MOCK_WBTC_MARKET_DID];
deployWBTCMarket.dependencies = [
  MOCK_STABLE_DID,
  MOCK_WBTC_DID,
  MOCK_PRICE_PROVIDER,
  PRICE_PROVIDER_SET_PRICE
]
