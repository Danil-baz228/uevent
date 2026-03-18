import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1760000000000 implements MigrationInterface {
  name = 'InitialSchema1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "displayName" character varying NOT NULL,
        "passwordHash" character varying NOT NULL,
        "refreshTokenHash" character varying,
        "interests" text array NOT NULL DEFAULT '{}'::text[],
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "category" character varying NOT NULL,
        "city" character varying NOT NULL,
        "startsAt" TIMESTAMPTZ NOT NULL,
        "price" numeric(10,2) NOT NULL DEFAULT '0',
        "capacity" integer NOT NULL DEFAULT '50',
        "organizerId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_events_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "event_registrations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "eventId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "status" character varying(32) NOT NULL,
        "paymentProvider" character varying(32) NOT NULL,
        "quantity" integer NOT NULL DEFAULT '1',
        "amountTotal" numeric(10,2) NOT NULL DEFAULT '0',
        "stripeCheckoutSessionId" character varying,
        "stripePaymentStatus" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_event_registrations_event_user" UNIQUE ("eventId", "userId"),
        CONSTRAINT "PK_event_registrations_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_events_organizer'
        ) THEN
          ALTER TABLE "events"
          ADD CONSTRAINT "FK_events_organizer"
          FOREIGN KEY ("organizerId") REFERENCES "users"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_event_registrations_event'
        ) THEN
          ALTER TABLE "event_registrations"
          ADD CONSTRAINT "FK_event_registrations_event"
          FOREIGN KEY ("eventId") REFERENCES "events"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_event_registrations_user'
        ) THEN
          ALTER TABLE "event_registrations"
          ADD CONSTRAINT "FK_event_registrations_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "event_registrations" DROP CONSTRAINT IF EXISTS "FK_event_registrations_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_registrations" DROP CONSTRAINT IF EXISTS "FK_event_registrations_event"`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "FK_events_organizer"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "event_registrations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
