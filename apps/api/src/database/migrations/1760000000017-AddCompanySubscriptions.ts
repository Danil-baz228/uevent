import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanySubscriptions1760000000017 implements MigrationInterface {
  name = 'AddCompanySubscriptions1760000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" ADD "subscribedCompanyIds" uuid array NOT NULL DEFAULT \'{}\'',
    );
    await queryRunner.query('ALTER TABLE "notifications" ADD "companyId" uuid');
    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD CONSTRAINT "FK_notifications_company"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_company"',
    );
    await queryRunner.query('ALTER TABLE "notifications" DROP COLUMN "companyId"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "subscribedCompanyIds"');
  }
}
