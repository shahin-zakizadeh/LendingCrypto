import fs from 'fs';

import { mnemonicToSeed, generateMnemonic } from 'bip39';
import { privateToAddress } from 'ethereumjs-util';
import { hdkey } from 'ethereumjs-wallet';
import { task } from 'hardhat/config';

import path from "path";

task('generate', 'Create a mnemonic for builder deploys', async (_, hre) => {
  const mnemonic = generateMnemonic();
  const seed = await mnemonicToSeed(mnemonic);
  const hdwallet = hdkey.fromMasterSeed(seed);
  const walletHdPath = "m/44'/60'/0'/0/";
  const accountIndex = 0;
  const fullPath = walletHdPath + accountIndex.toString();
  const wallet = hdwallet.derivePath(fullPath).getWallet();
  const address = `0x${privateToAddress(wallet.getPrivateKey()).toString('hex')}`;
  console.log(`🔐 Account Generated as ${address} and set as mnemonic in packages/solidity-ts`);
  console.log("💬 Use 'yarn account' to get more information about the deployment account.");
  console.log("💬 Use 'yarn secret' to get the private key.");
  const dirPath = hre.config.paths.mnemonicsDir;
  fs.mkdirSync(dirPath, { recursive: true })
  const mnemonicsFile = path.join(dirPath, `${address}.secret`)
  fs.writeFileSync(mnemonicsFile, mnemonic.toString());
  fs.writeFileSync(hre.config.paths.mnemonicsFile, mnemonic.toString());
});
