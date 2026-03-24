import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventPromoCodes1760000000015 implements MigrationInterface {
  name = 'AddEventPromoCodes1760000000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN "promoCodes" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
      DROP COLUMN "promoCodes"
    `);
  }
}
