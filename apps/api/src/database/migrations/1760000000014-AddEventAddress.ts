import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventAddress1760000000014 implements MigrationInterface {
  name = 'AddEventAddress1760000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN "address" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
      DROP COLUMN "address"
    `);
  }
}
