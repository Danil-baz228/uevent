import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetFieldsToUsers1760000000023
  implements MigrationInterface
{
  name = 'AddPasswordResetFieldsToUsers1760000000023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "passwordResetToken" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "passwordResetTokenExpiresAt" TIMESTAMP WITH TIME ZONE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "passwordResetTokenExpiresAt"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "passwordResetToken"
    `);
  }
}
