import { DeployFunction } from 'hardhat-deploy/dist/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { MOCK_STABLE_DID } from './10_deployStable';
import { HARDHAT_SETUP } from '../../utils/deployments-tags';
import { MOCK_WBTC_MARKET_DID } from './30_deployCollateralMarket';
import { MockToken__factory, SimpleInterestMarket__factory } from '../../typechain-types';
import { exec } from "@lenclub/hardon";
import { parseEther } from "ethers/lib/utils.js";

export const WBTC_DEBT_CEILING_DID = 'mock_wbtc_debt_ceiling_vault';

const increaseDebtCeiling: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployer } = await hre.hardon.getHardhatSigners();
  const stablecoinDeployment = await hre.deployments.get(MOCK_STABLE_DID);
  const stablecoin = MockToken__factory.connect(stablecoinDeployment.address, deployer)
  const marketDeployment = await hre.deployments.get(MOCK_WBTC_MARKET_DID);
  await exec(() => stablecoin.mint(marketDeployment.address, parseEther("100000")));
  const market = SimpleInterestMarket__factory.connect(marketDeployment.address, deployer);
  await exec(() => market.setDailyIssuanceLimit(parseEther("10000")))
};

export default increaseDebtCeiling;
increaseDebtCeiling.id = WBTC_DEBT_CEILING_DID;
increaseDebtCeiling.tags = [WBTC_DEBT_CEILING_DID, HARDHAT_SETUP];
increaseDebtCeiling.dependencies = [MOCK_WBTC_MARKET_DID, MOCK_STABLE_DID]
