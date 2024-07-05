import { Asset } from "../../../assets/entities/asset.entity";
import { PriceSource } from "../../../assets/entities/price-source.entity"

interface PriceSourceFactoryOptions {
    denominatorId?: number;
    priority?: number;
    enable?: boolean;
    type?: string;
}

let contractAddress = 10000;

export const priceSourceFactory = (asset: Asset, options?: PriceSourceFactoryOptions) => {
    contractAddress += 1;
    const ps = new PriceSource();
    ps.address = `0x${contractAddress.toString(16)}`;
    ps.chainId = asset.chainId;
    ps.assetId = asset.id;
    ps.denominatorId = options?.denominatorId ?? null
    ps.priority = options?.priority ?? 100;
    ps.enabled = options?.enable
    ps.type = options?.type ?? "factory"
    return ps;
}