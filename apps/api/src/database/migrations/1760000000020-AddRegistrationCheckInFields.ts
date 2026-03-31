import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRegistrationCheckInFields1760000000020
  implements MigrationInterface
{
  name = 'AddRegistrationCheckInFields1760000000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "event_registrations" ADD "checkedInAt" TIMESTAMPTZ',
    );
    await queryRunner.query(
      'ALTER TABLE "event_registrations" ADD "checkedInByUserId" character varying',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "event_registrations" DROP COLUMN "checkedInByUserId"',
    );
    await queryRunner.query(
      'ALTER TABLE "event_registrations" DROP COLUMN "checkedInAt"',
    );
  }
}
