import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttendeeVisibility1760000000008 implements MigrationInterface {
  name = 'AddAttendeeVisibility1760000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "events" ADD "attendeeVisibility" character varying NOT NULL DEFAULT \'everyone\'',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "events" DROP COLUMN "attendeeVisibility"');
  }
}
