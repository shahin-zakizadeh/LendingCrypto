import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from './entities/asset.entity';

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(Asset)
    private assets: Repository<Asset>,
  ) { }

  async registerAsset(asset: Asset) {
    try {
      return await this.assets.save(asset);
    } catch (error) {
      if (!error.message.includes('duplicate')) {
        throw error;
      }
    }
    return this.getAsset(asset.address, asset.chainId);
  }

  async getAsset(address: string, chainId: number) {
    return await this.assets.findOneBy({ address, chainId });
  }
}
