import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentReceiptArtifacts1760000000019
  implements MigrationInterface
{
  name = 'AddPaymentReceiptArtifacts1760000000019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "event_registrations"
      ADD COLUMN IF NOT EXISTS "ticketAssetPath" character varying,
      ADD COLUMN IF NOT EXISTS "paymentReceiptPreviewPath" character varying,
      ADD COLUMN IF NOT EXISTS "paymentReceiptMessageId" character varying,
      ADD COLUMN IF NOT EXISTS "paymentReceiptSentAt" TIMESTAMPTZ
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "event_registrations"
      DROP COLUMN IF EXISTS "paymentReceiptSentAt",
      DROP COLUMN IF EXISTS "paymentReceiptMessageId",
      DROP COLUMN IF EXISTS "paymentReceiptPreviewPath",
      DROP COLUMN IF EXISTS "ticketAssetPath"
    `);
  }
}
