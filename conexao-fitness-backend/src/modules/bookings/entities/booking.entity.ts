import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Service } from '../../services/entities/service.entity';
import { ScheduleSlot } from '../../services/entities/schedule-slot.entity';
import { User } from '../../users/entities/user.entity';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

/**
 * Índices declarados no nível de entidade (TypeORM sincroniza em dev;
 * em produção são criados pela migration BookingsCancelledAtAndIndexes).
 *
 * - IDX_bookings_slot_id      → lookup de bookings por slot (lock + queries)
 * - IDX_bookings_student_id   → listStudentBookings
 * - IDX_bookings_service_status → listServiceBookings com filtro de status
 *
 * O UNIQUE PARTIAL INDEX (UQ_bookings_slot_active) NÃO pode ser expresso via
 * decorator TypeORM (@Index + where parcial não é suportado) — está apenas
 * na migration explícita.
 */
@Entity('bookings')
@Index('IDX_bookings_slot_id', ['slotId'])
@Index('IDX_bookings_student_id', ['studentId'])
@Index('IDX_bookings_service_status', ['serviceId', 'status'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  serviceId: string;

  @Column({ type: 'uuid' })
  slotId: string;

  @Column({ type: 'uuid' })
  studentId: string;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.CONFIRMED,
  })
  status: BookingStatus;

  /**
   * Preenchido no momento do cancelamento.
   * null quando o booking está CONFIRMED ou PENDING.
   * Invariante: cancelledAt !== null ↔ status === CANCELLED.
   */
  @Column({ type: 'timestamptz', nullable: true, default: null })
  cancelledAt: Date | null;

  @ManyToOne(() => Service, (service) => service.bookings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @ManyToOne(() => ScheduleSlot, (slot) => slot.bookings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'slotId' })
  slot: ScheduleSlot;

  @ManyToOne(() => User, (user) => user.bookings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'studentId' })
  student: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
