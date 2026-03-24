import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyNews1760000000013 implements MigrationInterface {
  name = 'AddCompanyNews1760000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "company_news" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "companyId" uuid NOT NULL,
        "authorId" uuid NOT NULL,
        "title" character varying NOT NULL,
        "content" text NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_company_news_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "company_news"
      ADD CONSTRAINT "FK_company_news_company"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "company_news"
      ADD CONSTRAINT "FK_company_news_author"
      FOREIGN KEY ("authorId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "company_news" DROP CONSTRAINT "FK_company_news_author"
    `);
    await queryRunner.query(`
      ALTER TABLE "company_news" DROP CONSTRAINT "FK_company_news_company"
    `);
    await queryRunner.query(`
      DROP TABLE "company_news"
    `);
  }
}
