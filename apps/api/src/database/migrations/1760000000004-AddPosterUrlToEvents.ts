import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPosterUrlToEvents1760000000004 implements MigrationInterface {
  name = 'AddPosterUrlToEvents1760000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "events" ADD "posterUrl" character varying',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "events" DROP COLUMN "posterUrl"');
  }
}
