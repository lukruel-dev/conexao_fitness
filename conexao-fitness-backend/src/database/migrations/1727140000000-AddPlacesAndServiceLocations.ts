import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlacesAndServiceLocations1727140000000 implements MigrationInterface {
  name = 'AddPlacesAndServiceLocations1727140000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Tabela de Indicações de Academias
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "gym_indications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "placeId" character varying(150) NOT NULL,
        "gymName" character varying(180) NOT NULL,
        "gymAddress" text,
        "city" character varying(100),
        "state" character varying(10),
        "userId" uuid,
        "userIp" character varying(64),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_gym_indications_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_gym_indications_placeId" ON "gym_indications" ("placeId");
      CREATE INDEX IF NOT EXISTS "IDX_gym_indications_city" ON "gym_indications" ("city");
      CREATE INDEX IF NOT EXISTS "IDX_gym_indications_userId" ON "gym_indications" ("userId");
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_gym_indications_place_user" ON "gym_indications" ("placeId", "userId") WHERE "userId" IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_gym_indications_place_ip" ON "gym_indications" ("placeId", "userIp") WHERE "userId" IS NULL;
    `);

    // 2. Coluna googlePlaceId na academia_profiles
    await queryRunner.query(`
      ALTER TABLE "academia_profiles" 
      ADD COLUMN IF NOT EXISTS "googlePlaceId" character varying(150);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_academia_profiles_googlePlaceId" ON "academia_profiles" ("googlePlaceId");
    `);

    // 3. Colunas de local e formato de atendimento na tabela services
    await queryRunner.query(`
      ALTER TABLE "services"
      ADD COLUMN IF NOT EXISTS "attendanceType" character varying(20) DEFAULT 'PRESENCIAL',
      ADD COLUMN IF NOT EXISTS "locationType" character varying(30),
      ADD COLUMN IF NOT EXISTS "partnerGymId" uuid,
      ADD COLUMN IF NOT EXISTS "locationName" character varying(180),
      ADD COLUMN IF NOT EXISTS "locationAddress" text,
      ADD COLUMN IF NOT EXISTS "locationCity" character varying(100),
      ADD COLUMN IF NOT EXISTS "locationState" character varying(10),
      ADD COLUMN IF NOT EXISTS "locationPlaceId" character varying(150),
      ADD COLUMN IF NOT EXISTS "onlineInstructions" text;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_services_locationCity" ON "services" ("locationCity");
      CREATE INDEX IF NOT EXISTS "IDX_services_attendanceType" ON "services" ("attendanceType");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "services"
      DROP COLUMN IF EXISTS "onlineInstructions",
      DROP COLUMN IF EXISTS "locationPlaceId",
      DROP COLUMN IF EXISTS "locationState",
      DROP COLUMN IF EXISTS "locationCity",
      DROP COLUMN IF EXISTS "locationAddress",
      DROP COLUMN IF EXISTS "locationName",
      DROP COLUMN IF EXISTS "partnerGymId",
      DROP COLUMN IF EXISTS "locationType",
      DROP COLUMN IF EXISTS "attendanceType";
    `);

    await queryRunner.query(`
      ALTER TABLE "academia_profiles" DROP COLUMN IF EXISTS "googlePlaceId";
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "gym_indications";
    `);
  }
}
