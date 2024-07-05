import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getMnemonic } from '../utils';
import { Wallet } from 'ethers';

task('secret', "Prints the account's secret key")
.setAction(
    async (taskArgs: { account: string }, hre: HardhatRuntimeEnvironment) => {
        const mnemonic = getMnemonic();
        const wallet = Wallet.fromMnemonic(mnemonic);
        console.log('Secret key:', wallet.privateKey);
    }
);