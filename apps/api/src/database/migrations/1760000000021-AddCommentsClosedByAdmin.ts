import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommentsClosedByAdmin1760000000021 implements MigrationInterface {
  name = 'AddCommentsClosedByAdmin1760000000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "events" ADD "commentsClosedByAdmin" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "commentsClosedByAdmin"`);
  }
}
