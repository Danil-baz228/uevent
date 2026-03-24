import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanies1760000000012 implements MigrationInterface {
  name = 'AddCompanies1760000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "location" character varying NOT NULL,
        "description" text,
        "ownerId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_companies_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD CONSTRAINT "FK_companies_owner"
      FOREIGN KEY ("ownerId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD "companyId" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD CONSTRAINT "FK_events_company"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events" DROP CONSTRAINT "FK_events_company"
    `);
    await queryRunner.query(`
      ALTER TABLE "events" DROP COLUMN "companyId"
    `);
    await queryRunner.query(`
      ALTER TABLE "companies" DROP CONSTRAINT "FK_companies_owner"
    `);
    await queryRunner.query(`
      DROP TABLE "companies"
    `);
  }
}
