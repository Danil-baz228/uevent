import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventRedirectAfterPurchase1760000000016 implements MigrationInterface {
  name = 'AddEventRedirectAfterPurchase1760000000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "redirectAfterPurchaseUrl" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
      DROP COLUMN IF EXISTS "redirectAfterPurchaseUrl"
    `);
  }
}
