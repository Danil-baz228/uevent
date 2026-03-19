import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventSettings1760000000005 implements MigrationInterface {
  name = 'AddEventSettings1760000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "events" ADD "hideAttendeeNames" boolean NOT NULL DEFAULT false',
    );
    await queryRunner.query(
      'ALTER TABLE "events" ADD "commentsClosed" boolean NOT NULL DEFAULT false',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "events" DROP COLUMN "commentsClosed"');
    await queryRunner.query('ALTER TABLE "events" DROP COLUMN "hideAttendeeNames"');
  }
}
