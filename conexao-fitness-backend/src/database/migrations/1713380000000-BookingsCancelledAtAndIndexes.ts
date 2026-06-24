import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: BookingsCancelledAtAndIndexes
 *
 * O que faz:
 * 1. Adiciona coluna `cancelled_at` (TIMESTAMPTZ, nullable) em `bookings`.
 * 2. Cria índice em bookings(slot_id)      → acelera lookup de bookings por slot.
 * 3. Cria índice em bookings(student_id)   → acelera listStudentBookings.
 * 4. Cria índice em bookings(service_id, status) → acelera listServiceBookings com filtro.
 * 5. Cria UNIQUE PARTIAL INDEX que impede mais de um booking ativo (CONFIRMED ou PENDING)
 *    por slot ao mesmo tempo, diretamente no banco.
 *    Esta é a última linha de defesa contra race conditions residuais que escapam
 *    do lock pessimista (ex.: replay de requests, bugs de transação).
 *
 * Decisão sobre o unique parcial:
 *   CREATE UNIQUE INDEX ... WHERE status IN ('CONFIRMED','PENDING')
 *   - Postgres suporta índices parciais nativamente.
 *   - Bookings CANCELLED não entram no índice, então histórico de cancelamentos
 *     por slot é ilimitado.
 *   - Se um INSERT violar a constraint, Postgres lança um erro 23505 (unique_violation)
 *     que TypeORM expõe como QueryFailedError — o service deve capturá-lo.
 */
export class BookingsCancelledAtAndIndexes1713380000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Coluna cancelled_at
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD COLUMN IF NOT EXISTS "cancelled_at" TIMESTAMPTZ DEFAULT NULL
    `);

    // 2. Índice em slot_id (suporte ao lock de slot + listagens por slot)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_bookings_slot_id"
      ON "bookings" ("slot_id")
    `);

    // 3. Índice em student_id (listStudentBookings)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_bookings_student_id"
      ON "bookings" ("student_id")
    `);

    // 4. Índice composto (service_id, status) → listServiceBookings com filtro de status
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_bookings_service_id_status"
      ON "bookings" ("service_id", "status")
    `);

    // 5. Unique partial index: no máximo 1 booking ativo (CONFIRMED ou PENDING) por slot
    //    Esta constraint é a garantia a nível de banco — complementar ao lock pessimista.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_bookings_slot_active"
      ON "bookings" ("slot_id")
      WHERE status IN ('CONFIRMED', 'PENDING')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_bookings_slot_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_service_id_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_student_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_slot_id"`);
    await queryRunner.query(`
      ALTER TABLE "bookings"
      DROP COLUMN IF EXISTS "cancelled_at"
    `);
  }
}
