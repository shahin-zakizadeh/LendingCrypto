import { MigrationInterface, QueryRunner } from "typeorm";

export class AssetsAndMarkets1678286768556 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "volume_entry" ("id" SERIAL NOT NULL, "timeStamp" TIMESTAMP NOT NULL DEFAULT now(), "timeFrame" integer NOT NULL, "volume" double precision NOT NULL, "source" character varying NOT NULL, "assetId" integer NOT NULL, CONSTRAINT "PK_553de7b2008042a5b99a544c076" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "market_cap_entry" ("id" SERIAL NOT NULL, "timeStamp" TIMESTAMP NOT NULL DEFAULT now(), "marketCap" double precision NOT NULL, "source" character varying NOT NULL, "assetId" integer NOT NULL, CONSTRAINT "PK_ca0c86b0b9ca89853ae3e3a1802" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "price_entry" ("at" TIMESTAMP NOT NULL, "usdValue" numeric(78,18) NOT NULL, "value" numeric(78,18) NOT NULL, "priceSourceId" integer NOT NULL, CONSTRAINT "PK_2a11f60bbcffb2a47f8b48c6b2b" PRIMARY KEY ("at", "priceSourceId"))`);
        await queryRunner.query(`CREATE TABLE "price_source" ("id" SERIAL NOT NULL, "address" character varying(42), "chainId" integer, "decimals" integer, "denominatorId" integer, "priority" integer NOT NULL DEFAULT '0', "enabled" boolean NOT NULL DEFAULT false, "label" character varying, "type" character varying NOT NULL, "assetId" integer NOT NULL, CONSTRAINT "PK_a90799459e9bed4023e3798cadb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2f811d3e15f855bbbea5ffd9fe" ON "price_source" ("address", "chainId", "assetId") `);
        await queryRunner.query(`CREATE TABLE "asset" ("id" SERIAL NOT NULL, "address" character varying(42) NOT NULL, "chainId" integer NOT NULL, "decimals" smallint, "symbol" character varying, "name" character varying, "type" character varying(20) NOT NULL, CONSTRAINT "PK_1209d107fe21482beaea51b745e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b70c38c12d6a1c579f3e18d6e6" ON "asset" ("address", "chainId") `);
        await queryRunner.query(`CREATE TABLE "slippage_entry" ("timestamp" TIMESTAMP NOT NULL DEFAULT now(), "fromAssetId" integer NOT NULL, "toAssetId" integer NOT NULL, "tradeSize" real NOT NULL, "slippage" real NOT NULL, CONSTRAINT "PK_0dd3edfbf48fdb01a66944f5994" PRIMARY KEY ("timestamp", "fromAssetId", "toAssetId", "tradeSize"))`);
        await queryRunner.query(`CREATE TABLE "account" ("id" SERIAL NOT NULL, "nftId" integer NOT NULL, "marketId" integer NOT NULL, "owner" character varying(42), "collateralAmount" numeric(78,18) NOT NULL DEFAULT '0', "principalAmount" numeric(78,18) NOT NULL DEFAULT '0', "interestIndex" numeric(78,18) NOT NULL, CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_571c3f3169c3826f67f32348ab" ON "account" ("nftId", "marketId") `);
        await queryRunner.query(`CREATE TABLE "market" ("id" SERIAL NOT NULL, "address" character varying(42) NOT NULL, "chainId" integer NOT NULL, "closingFee" numeric(78,18) NOT NULL, "liquidationThreshold" numeric(78,18) NOT NULL, "liquidationMaxHR" numeric(78,18) NOT NULL, "liquidationPenalty" numeric(78,3) NOT NULL, "interestIndex" numeric(78,18) NOT NULL, "smallAccountThreshold" numeric(78,0) NOT NULL, "collateralAssetId" integer NOT NULL, "principalAssetId" integer NOT NULL, "lastSync" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_1e9a2963edfd331d92018e3abac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_035a4c41b4b11c5726c54d68ec" ON "market" ("address", "chainId") `);
        await queryRunner.query(`ALTER TABLE "price_entry" ADD CONSTRAINT "FK_76fd41d4996313578e76651402f" FOREIGN KEY ("priceSourceId") REFERENCES "price_source"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "price_source" ADD CONSTRAINT "FK_2f5c23c38fcb0c214ead9db2493" FOREIGN KEY ("denominatorId") REFERENCES "asset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "price_source" ADD CONSTRAINT "FK_a684a6e9d3c4d8b180037b2accc" FOREIGN KEY ("assetId") REFERENCES "asset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "slippage_entry" ADD CONSTRAINT "FK_1c687e186301d7d7c19bb3ba7f0" FOREIGN KEY ("fromAssetId") REFERENCES "asset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "slippage_entry" ADD CONSTRAINT "FK_e93986194180a711899bbc9064e" FOREIGN KEY ("toAssetId") REFERENCES "asset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "account" ADD CONSTRAINT "FK_519dcb1e6c9c6ac2bb2c8e6cee7" FOREIGN KEY ("marketId") REFERENCES "market"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "market" ADD CONSTRAINT "FK_6dadf334363e83d21503b3129c0" FOREIGN KEY ("collateralAssetId") REFERENCES "asset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "market" ADD CONSTRAINT "FK_a61685d2878700bc6fd63136829" FOREIGN KEY ("principalAssetId") REFERENCES "asset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "market" DROP CONSTRAINT "FK_a61685d2878700bc6fd63136829"`);
        await queryRunner.query(`ALTER TABLE "market" DROP CONSTRAINT "FK_6dadf334363e83d21503b3129c0"`);
        await queryRunner.query(`ALTER TABLE "account" DROP CONSTRAINT "FK_519dcb1e6c9c6ac2bb2c8e6cee7"`);
        await queryRunner.query(`ALTER TABLE "slippage_entry" DROP CONSTRAINT "FK_e93986194180a711899bbc9064e"`);
        await queryRunner.query(`ALTER TABLE "slippage_entry" DROP CONSTRAINT "FK_1c687e186301d7d7c19bb3ba7f0"`);
        await queryRunner.query(`ALTER TABLE "price_source" DROP CONSTRAINT "FK_a684a6e9d3c4d8b180037b2accc"`);
        await queryRunner.query(`ALTER TABLE "price_source" DROP CONSTRAINT "FK_2f5c23c38fcb0c214ead9db2493"`);
        await queryRunner.query(`ALTER TABLE "price_entry" DROP CONSTRAINT "FK_76fd41d4996313578e76651402f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_035a4c41b4b11c5726c54d68ec"`);
        await queryRunner.query(`DROP TABLE "market"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_571c3f3169c3826f67f32348ab"`);
        await queryRunner.query(`DROP TABLE "account"`);
        await queryRunner.query(`DROP TABLE "slippage_entry"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b70c38c12d6a1c579f3e18d6e6"`);
        await queryRunner.query(`DROP TABLE "asset"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2f811d3e15f855bbbea5ffd9fe"`);
        await queryRunner.query(`DROP TABLE "price_source"`);
        await queryRunner.query(`DROP TABLE "price_entry"`);
        await queryRunner.query(`DROP TABLE "market_cap_entry"`);
        await queryRunner.query(`DROP TABLE "volume_entry"`);
    }


}
