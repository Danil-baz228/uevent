import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventComments1760000000002 implements MigrationInterface {
  name = 'AddEventComments1760000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "event_comments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "eventId" uuid NOT NULL,
        "authorId" uuid NOT NULL,
        "content" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_event_comments_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_event_comments_event') THEN
          ALTER TABLE "event_comments"
          ADD CONSTRAINT "FK_event_comments_event"
          FOREIGN KEY ("eventId") REFERENCES "events"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_event_comments_author') THEN
          ALTER TABLE "event_comments"
          ADD CONSTRAINT "FK_event_comments_author"
          FOREIGN KEY ("authorId") REFERENCES "users"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "event_comments" DROP CONSTRAINT IF EXISTS "FK_event_comments_author"`);
    await queryRunner.query(`ALTER TABLE "event_comments" DROP CONSTRAINT IF EXISTS "FK_event_comments_event"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "event_comments"`);
  }
}
