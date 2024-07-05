import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Asset } from '../../assets/entities/asset.entity';

@Entity()
export class SlippageEntry {

  @PrimaryColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @PrimaryColumn()
  fromAssetId: number;

  @PrimaryColumn()
  toAssetId: number;

  @PrimaryColumn({ type: 'real' })
  tradeSize: number;

  @Column({ type: 'real' })
  slippage: number;

  @ManyToOne(() => Asset)
  fromAsset: Asset;

  @ManyToOne(() => Asset)
  toAsset: Asset;
}

