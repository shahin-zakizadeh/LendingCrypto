import { MigrationInterface, QueryRunner } from "typeorm"

export class SlippageEntriesEnableHypertable1678287283967 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `SELECT create_hypertable('slippage_entry', 'timestamp');`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
