import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRegistrationNameVisibility1760000000018
  implements MigrationInterface
{
  name = 'AddRegistrationNameVisibility1760000000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "event_registrations" ADD "showAttendeeName" boolean NOT NULL DEFAULT true',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "event_registrations" DROP COLUMN "showAttendeeName"',
    );
  }
}
