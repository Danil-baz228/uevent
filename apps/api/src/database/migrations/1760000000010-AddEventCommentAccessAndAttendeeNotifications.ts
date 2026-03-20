import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventCommentAccessAndAttendeeNotifications1760000000010
  implements MigrationInterface
{
  name = 'AddEventCommentAccessAndAttendeeNotifications1760000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "events" ADD "notifyOnNewAttendee" boolean NOT NULL DEFAULT true',
    );
    await queryRunner.query(
      'ALTER TABLE "events" ADD "commentAccess" character varying NOT NULL DEFAULT \'everyone\'',
    );
    await queryRunner.query(
      'UPDATE "events" SET "commentAccess" = CASE WHEN "commentsClosed" = true THEN \'closed\' ELSE \'everyone\' END',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "events" DROP COLUMN "commentAccess"');
    await queryRunner.query('ALTER TABLE "events" DROP COLUMN "notifyOnNewAttendee"');
  }
}
