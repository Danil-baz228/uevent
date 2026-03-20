import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventPublishAt1760000000009 implements MigrationInterface {
  name = 'AddEventPublishAt1760000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "events" ADD "publishAt" TIMESTAMPTZ');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "events" DROP COLUMN "publishAt"');
  }
}
