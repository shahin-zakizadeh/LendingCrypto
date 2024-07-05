import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity()
export class VolumeEntry {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    timeStamp: Date;

    @Column()
    timeFrame: number; /** @dev @param timeFrame is in Minutes => 1440= 24 -hours, 10080= 7-days, 43200= 30-days, 525600= 365-days */
    @Column({
        type: 'double precision',
    })
    volume: number;

    @Column()
    source: string;

    @Column()
    assetId: number;
}