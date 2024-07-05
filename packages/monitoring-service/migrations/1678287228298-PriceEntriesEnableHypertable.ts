import { MigrationInterface, QueryRunner } from "typeorm"

export class PriceEntriesEnableHypertable1678287228298 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `SELECT create_hypertable('price_entry', 'at');`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
