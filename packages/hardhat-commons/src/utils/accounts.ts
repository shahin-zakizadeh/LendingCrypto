import { getAddress, isAddress } from '@ethersproject/address';
import { mnemonicToSeed } from 'bip39';
import { privateToAddress } from 'ethereumjs-util';
import { hdkey } from 'ethereumjs-wallet';
import { ethers, Wallet } from 'ethers';
import { keccak256, randomBytes } from 'ethers/lib/utils';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {HardhatRuntimeEnvironment} from "hardhat/types";

export const getAccountData = async (mnemonic: string): Promise<{ address: string; wallet: Wallet }> => {
  const seed = await mnemonicToSeed(mnemonic);
  const hdwallet = hdkey.fromMasterSeed(seed);
  const walletHdPath = "m/44'/60'/0'/0/";
  const accountIndex = 0;
  const fullPath = walletHdPath + accountIndex.toString();
  const wallet = hdwallet.derivePath(fullPath).getWallet();
  const address = `0x${privateToAddress(wallet.getPrivateKey()).toString('hex')}`;
  return { address, wallet: Wallet.fromMnemonic(mnemonic, fullPath) };
};

export const findFirstAddress = async (hre: HardhatRuntimeEnvironment, addr: string): Promise<string> => {
  if (isAddress(addr)) {
    return getAddress(addr);
  }
  const accounts = await hre.ethers.provider.listAccounts();
  if (accounts !== undefined) {
    const temp: string | undefined = accounts.find((f: string) => f === addr);
    if (temp != null && isAddress(temp)) return temp[0];
  }
  throw new Error(`Could not normalize address: ${addr}`);
};

export const createAddress = (
  from: string,
  initCode: string
): { address: string; from: string; salt: Uint8Array; initCodeHash: string; initCode: string } => {
  const salt = randomBytes(32);
  const initCodeHash = keccak256(initCode);

  const address = ethers.utils.getCreate2Address(from, salt, initCodeHash);
  return { address, from, salt, initCodeHash, initCode };
};

export const getHardhatSigners = async (hre: HardhatRuntimeEnvironment): Promise<Record<string, SignerWithAddress>> => {
  const accounts = await hre.getNamedAccounts();
  const signers = {} as Record<string, SignerWithAddress>
  for (const [name, address] of Object.entries(accounts)) {
    signers[name] = await hre.ethers.getSigner(address)
  }
  return signers
};

export const getUnnamedSigners = async (hre: HardhatRuntimeEnvironment) => {
  const accounts = await hre.getUnnamedAccounts();
  return await Promise.all(accounts.map((account) => hre.ethers.getSigner(account)));
};
