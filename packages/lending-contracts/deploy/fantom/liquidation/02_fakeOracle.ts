
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { FANTOM_FORK } from '../../../utils/deployments-tags';
import { AggregatorV3Interface__factory, MockAggregatorV3__factory } from '../../../typechain-types';

export const FAKE_ORACLE_DID = 'fake_oracle';
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments } = hre;

    const { deployer } = await hre.hardon.getHardhatSigners();
    const deployment = await deployments.deploy(FAKE_ORACLE_DID, {
        from: deployer.address,
        contract: 'MockAggregatorV3',
        args: [],
        log: true,
    });
    const realFtmOracle = AggregatorV3Interface__factory.connect(hre.hardon.getExternalAddress("CL_FTM_FEED"), deployer)
    const { answer: realFtmPrice } = await realFtmOracle.latestRoundData();
    const fakeOracle = MockAggregatorV3__factory.connect(deployment.address, deployer)
    await fakeOracle.setAnswer(10, realFtmPrice, 1000, 1009, 10);
};
func.id = FAKE_ORACLE_DID;
func.tags = [FANTOM_FORK]
export default func;
