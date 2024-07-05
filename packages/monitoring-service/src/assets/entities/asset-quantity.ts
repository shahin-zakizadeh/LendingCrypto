import { Asset } from './asset.entity';
import { BigNumber } from 'ethers';

export class AssetQuantity {
  constructor(public asset: Asset, public quantity: BigNumber) {}
}
