import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRegistrationReminderFields1760000000011
  implements MigrationInterface
{
  name = 'AddRegistrationReminderFields1760000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "event_registrations" ADD "reminderAt" TIMESTAMPTZ',
    );
    await queryRunner.query(
      'ALTER TABLE "event_registrations" ADD "reminderSentAt" TIMESTAMPTZ',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "event_registrations" DROP COLUMN "reminderSentAt"',
    );
    await queryRunner.query(
      'ALTER TABLE "event_registrations" DROP COLUMN "reminderAt"',
    );
  }
}
