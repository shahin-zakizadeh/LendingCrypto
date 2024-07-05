import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Asset } from './asset.entity';
import { PriceEntry } from './price-entry.entity';

@Entity()
@Index(['address', 'chainId', 'assetId'], { unique: true })
export class PriceSource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 42,
    type: 'varchar',
    nullable: true,
  })
  address: string;

  @Column({
    nullable: true,
  })
  chainId: number;

  @Column({ nullable: true })
  decimals: number;

  @ManyToOne(() => Asset)
  denominator: Promise<Asset>;

  @Column({ nullable: true })
  denominatorId: number;

  @Column({
    nullable: false,
    default: 0,
  })
  priority: number;

  @Column({
    nullable: false,
    default: false,
  })
  enabled: boolean;

  @Column({
    nullable: true,
  })
  label: string;

  @Column()
  type: string;

  @ManyToOne(() => Asset, (asset) => asset.priceSources)
  @JoinColumn()
  asset: Promise<Asset>;

  @Column()
  assetId: number;

  @OneToMany(() => PriceEntry, (priceEntry) => priceEntry.priceSource)
  entries: PriceEntry[];
}
