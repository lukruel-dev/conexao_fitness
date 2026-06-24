/**
 * PATCH para schedule-slot.entity.ts
 *
 * Problema:
 *   ScheduleSlot.studentId é uma segunda fonte de verdade sobre "quem reservou
 *   este slot". A fonte canônica é Booking.studentId.
 *   Manter os dois em sincronia requer atualizações em dois lugares e abre
 *   janela para inconsistência silenciosa (ex.: cancelamento atualiza Booking
 *   mas não limpa ScheduleSlot.studentId, ou vice-versa).
 *
 * Decisão arquitetural:
 *   Deprecar ScheduleSlot.studentId. A entidade deve expressar apenas o STATUS
 *   do slot (AVAILABLE / BOOKED / BLOCKED) — "quem reservou" é responsabilidade
 *   do agregado Booking.
 *
 * Plano de remoção (não-breaking):
 *   Fase 1 (este PR): adicionar @Deprecated JSDoc + não escrever mais nesse campo
 *                     a partir do BookingsService.
 *   Fase 2: migration para remover a coluna após confirmar que nenhum código a lê.
 *   Fase 3: remover o campo da entidade.
 *
 * Aplicar este diff em schedule-slot.entity.ts:
 */

/*
  ANTES:
  @Column({ type: 'uuid', nullable: true })
  studentId: string | null;

  DEPOIS:
  /**
   * @deprecated Fonte de verdade duplicada. Use Booking.studentId.
   * Este campo será removido em uma migration futura.
   * Não escrever neste campo a partir de BookingsService.
   * /
  @Column({ type: 'uuid', nullable: true })
  studentId: string | null;
*/

export {}; // evita que TypeScript trate este arquivo como script
