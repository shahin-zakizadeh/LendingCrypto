import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PriceSource } from './price-source.entity';

@Entity()
@Index(['address', 'chainId'], { unique: true })
export class Asset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 42,
    type: 'varchar',
    nullable: false,
  })
  address: string;

  @Column({
    nullable: false,
  })
  chainId: number;

  @Column({
    type: 'smallint',
    nullable: true,
  })
  decimals: number;

  @Column({
    nullable: true,
  })
  symbol: string;

  @Column({
    nullable: true,
  })
  name: string;

  @Column({
    nullable: false,
    length: 20,
    type: 'varchar',
  })
  type: string;

  @OneToMany(() => PriceSource, (priceSource) => priceSource.asset)
  priceSources: PriceSource[];
}
