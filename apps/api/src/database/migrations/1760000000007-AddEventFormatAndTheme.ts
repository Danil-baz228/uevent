import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventFormatAndTheme1760000000007 implements MigrationInterface {
  name = 'AddEventFormatAndTheme1760000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "events" ADD "format" character varying NOT NULL DEFAULT \'Meetup\'',
    );
    await queryRunner.query(
      'ALTER TABLE "events" ADD "theme" character varying NOT NULL DEFAULT \'Community\'',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "events" DROP COLUMN "theme"');
    await queryRunner.query('ALTER TABLE "events" DROP COLUMN "format"');
  }
}
