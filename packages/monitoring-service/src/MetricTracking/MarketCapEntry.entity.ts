import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity()
export class MarketCapEntry {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    timeStamp: Date;

    @Column({
        type: 'double precision',
    })
    marketCap: number;

    @Column()
    source: string;

    @Column()
    assetId: number;
}