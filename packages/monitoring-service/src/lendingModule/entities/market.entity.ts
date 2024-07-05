import { Asset } from '../../assets/entities/asset.entity';
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Account } from './account.entity';
import { decimalColumnType } from '../../utils/DecimalColumn';
import Decimal from 'decimal.js';

@Entity()
@Index(['address', 'chainId'], { unique: true })
export class Market {
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

  @Column(decimalColumnType())
  closingFee: Decimal;

  @Column(decimalColumnType())
  liquidationThreshold: Decimal;

  @Column(decimalColumnType())
  liquidationMaxHR: Decimal;

  @Column(decimalColumnType({ scale: 3 }))
  liquidationPenalty: Decimal;

  @Column(decimalColumnType())
  interestIndex: Decimal;

  @Column(decimalColumnType({ scale: 0 }))
  smallAccountThreshold: Decimal;

  @ManyToOne(() => Asset)
  @JoinTable()
  collateralAsset: Promise<Asset>;

  @ManyToOne(() => Asset)
  @JoinTable()
  principalAsset: Promise<Asset>;

  @Column()
  collateralAssetId: number;

  @Column()
  principalAssetId: number;

  @Column({
    default: 0,
  })
  lastSync: number;

  @OneToMany(() => Account, (account: Account) => account.market)
  accounts: Account[];
}
