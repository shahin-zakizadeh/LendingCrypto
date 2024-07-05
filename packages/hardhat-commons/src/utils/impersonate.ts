import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

export const impersonate = async (hre: HardhatRuntimeEnvironment, address: string): Promise<SignerWithAddress> => {
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [address],
  });
  return hre.ethers.getSigner(address);
};
