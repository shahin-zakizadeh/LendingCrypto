import {HardhatRuntimeEnvironment, HttpNetworkConfig} from "hardhat/types";

export const fork = async (networkName: string, blockNumber: number, hre: HardhatRuntimeEnvironment): Promise<{
  chainId: number,
  blockHeight: number
}> => {
  const network = hre.config.networks[networkName] as HttpNetworkConfig
  await hre.network.provider.request({
    method: 'hardhat_reset',
    params: [
      {
        forking: {
          jsonRpcUrl: network.url,
          blockNumber,
        },
      },
    ],
  });
  return {
    chainId: network.chainId ?? -1,
    blockHeight: blockNumber
  }
};
