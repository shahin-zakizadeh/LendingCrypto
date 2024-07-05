import { Asset } from "../../../assets/entities/asset.entity";

export const BTC_ADDRESS = "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6"
export const ETH_ADDRESS = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"
export const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
export const HardhatTestNetwork = 31337;
export const HardhatTestNetworkAddresBTC = "0x00000000BTC"

let assetAddress = 100000;

interface AssetFactoryOptions {
    chaindId?: number;
    decimals?: number;
    address?: string;
    type?: string;
}

export const assetFactory = (options?: AssetFactoryOptions) => {
    assetAddress += 1;
    const a = new Asset();
    a.chainId = options?.chaindId ?? Math.ceil(Math.random() * 1000);
    a.decimals = options?.decimals ?? Math.ceil(Math.random() * 18)
    a.address = options?.address ?? `0x${assetAddress.toString(16)}`;
    a.type = options?.type ?? "ERC20";
    return a;
}

export const polygonBtc = () => {
    const btc = new Asset();
    btc.chainId = 137;
    btc.decimals = 8;
    btc.address = BTC_ADDRESS;
    btc.type = "ERC20";
    return btc;
}

export const polygonEth = () => {
    const eth = new Asset();
    eth.chainId = 137;
    eth.decimals = 18;
    eth.address = ETH_ADDRESS;
    eth.type = "ERC20";
    return eth
}

export const polygonUsdc = () => {
    const usdc = new Asset();
    usdc.chainId = 137;
    usdc.decimals = 6;
    usdc.address = USDC_ADDRESS;
    usdc.type = "ERC20";
    return usdc;
}
export const hardhatTestNetworkBtc = () => {
    const hardHatBTC = new Asset();
    hardHatBTC.chainId = HardhatTestNetwork;
    hardHatBTC.decimals = 18;
    hardHatBTC.address = HardhatTestNetworkAddresBTC;
    hardHatBTC.type = "ERC20";
    return hardHatBTC;
}