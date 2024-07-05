import { HardhatRuntimeEnvironment } from 'hardhat/types';

export const mine = async (hre: HardhatRuntimeEnvironment, blocks = 1) => {
  for (let i = 0; i < blocks; i++) {
    await hre.network.provider.request({
      method: 'evm_mine',
    });
  }
};

export const increaseTime = async (hre: HardhatRuntimeEnvironment, seconds: number, blocks = 1) => {
  await hre.network.provider.request({
    method: 'evm_increaseTime',
    params: [seconds],
  });
  await mine(hre, blocks);
};

export const setTimestamp = async (hre: HardhatRuntimeEnvironment, timestamp: Date, blocks = 1) => {
  await hre.network.provider.request({
    method: 'evm_setNextBlockTimestamp',
    params: [Math.round(timestamp.getTime() / 1000)],
  });
  await mine(hre, blocks);
};
