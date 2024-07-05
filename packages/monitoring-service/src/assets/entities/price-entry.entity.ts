import Decimal from 'decimal.js';
import { decimalColumnType } from '../../utils/DecimalColumn';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { PriceSource } from './price-source.entity';

@Entity()
export class PriceEntry {
  @PrimaryColumn({
    nullable: false,
    type: 'timestamp',
  })
  at: Date;

  @Column(decimalColumnType())
  usdValue: Decimal;

  @Column(decimalColumnType())
  value: Decimal;

  @PrimaryColumn()
  priceSourceId: number

  @ManyToOne(() => PriceSource, (priceSource) => priceSource.entries)
  @JoinColumn()
  priceSource: PriceSource;
}
