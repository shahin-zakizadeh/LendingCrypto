import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from './entities/asset.entity';
import { AssetService } from './asset.service';
import { PriceSource } from './entities/price-source.entity';
import { PriceMonitor } from './price-monitor.service';
import { Prices } from './prices.service';
import { PriceEntry } from './entities/price-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Asset, PriceSource, PriceEntry])],
  providers: [AssetService, PriceMonitor, Prices],
  exports: [AssetService, PriceMonitor, Prices],
})
export class AssetsModule {}
