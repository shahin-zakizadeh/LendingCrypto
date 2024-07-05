import Decimal from 'decimal.js';
import { decimalColumnType } from '../../utils/DecimalColumn';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Market } from './market.entity';

@Entity()
@Index(['nftId', 'marketId'], { unique: true })
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    nullable: false,
  })
  nftId: number;

  @Column()
  marketId: number

  @Column({
    length: 42,
    type: 'varchar',
    nullable: true,
  })
  owner: string;

  @Column(decimalColumnType({ default: '0' }))
  collateralAmount: Decimal;

  @Column(decimalColumnType({ default: '0' }))
  principalAmount: Decimal;

  @Column(decimalColumnType())
  interestIndex: Decimal;

  @ManyToOne(() => Market, (market) => market.accounts, {
    cascade: true,
  })
  market: Promise<Market>;

}
