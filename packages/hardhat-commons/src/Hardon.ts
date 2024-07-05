import {HardhatRuntimeEnvironment} from "hardhat/types";
import { fork } from "./utils/fork";
import {increaseTime, mine, setTimestamp} from "./utils/chain";
import {impersonate} from "./utils/impersonate";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getHardhatSigners, getUnnamedSigners } from "./utils";

export class Hardon {
  private hre: HardhatRuntimeEnvironment;
  private chainId: number | null = null;
  private forkHeight: number | null = null;
  
  constructor(hre: HardhatRuntimeEnvironment) {
    this.hre = hre
  }

  public getChainId(): number{
    if (this.chainId != null) {
      return this.chainId;
    } else if (this.hre.network.config.chainId != null) {
      return this.hre.network.config.chainId;
    }
    throw new Error('Cannot find what chain we are interacting with');
  };

  public getForkedAtBlock() {
    return this.forkHeight ?? 0;
  };
  
  public setChainId(chainId: number) {
    this.chainId = chainId;
  }

  public async fork(networkName: string, blockNumber: number) {
    const {chainId, blockHeight} = await fork(networkName, blockNumber, this.hre)
    this.chainId = chainId;
    this.forkHeight = blockHeight
  }
  
  public async mine(blocks = 1) {
    await mine(this.hre, blocks)
  }
  
  public async increaseTime(seconds: number, blocks = 1){
    await increaseTime(this.hre, seconds, blocks)
  }

  public async setTimestamp(timestamp: Date, blocks = 1){
    await setTimestamp(this.hre, timestamp, blocks)
  }
  
  public async impersonate(address: string) {
    return impersonate(this.hre, address)
  }
  
  public getExternalAddress(name: string) {
    const externalAddresses = this.hre.config.externalAddresses
    const chainId = this.getChainId()
    if (chainId in externalAddresses) {
      return externalAddresses[chainId][name]
    }
    throw new Error(`Cannot find contract ${name}`);
  }
  
  public async getUnnamedSigners(): Promise<SignerWithAddress[]> {
    return getUnnamedSigners(this.hre);
  }

  public async getHardhatSigners(): Promise<Record<string, SignerWithAddress>> {
    return getHardhatSigners(this.hre);
  }

}
