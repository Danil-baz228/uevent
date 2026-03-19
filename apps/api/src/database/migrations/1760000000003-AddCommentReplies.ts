import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommentReplies1760000000003 implements MigrationInterface {
  name = 'AddCommentReplies1760000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "event_comments"
      ADD COLUMN IF NOT EXISTS "parentCommentId" uuid
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "event_comments"
      DROP COLUMN IF EXISTS "parentCommentId"
    `);
  }
}
