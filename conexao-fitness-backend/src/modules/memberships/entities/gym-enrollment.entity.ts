import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MembershipPlan } from './membership-plan.entity';
import { GymAccessLog } from './gym-access-log.entity';

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  SUSPENDED = 'SUSPENDED',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
}

export enum EnrollmentPaymentMethod {
  STRIPE = 'STRIPE',
  WALLET = 'WALLET',
  PIX = 'PIX',
  MANUAL = 'MANUAL',
}

export enum EnrollmentPaymentStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
  REFUNDED = 'REFUNDED',
}

@Entity('gym_enrollments')
@Index('IDX_gym_enrollments_student', ['studentId'])
@Index('IDX_gym_enrollments_academia', ['academiaId'])
@Index('IDX_gym_enrollments_status', ['academiaId', 'status'])
@Index('IDX_gym_enrollments_qr_code', ['qrAccessCode'], { unique: true })
export class GymEnrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column({ type: 'uuid' })
  academiaId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'academiaId' })
  academia: User;

  @Column({ type: 'uuid', nullable: true })
  planId?: string;

  @ManyToOne(() => MembershipPlan, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'planId' })
  plan?: MembershipPlan;

  @Column({ length: 120 })
  planName: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  amountPaid: string;

  @Column({
    type: 'enum',
    enum: EnrollmentPaymentMethod,
    default: EnrollmentPaymentMethod.STRIPE,
  })
  paymentMethod: EnrollmentPaymentMethod;

  @Column({
    type: 'enum',
    enum: EnrollmentPaymentStatus,
    default: EnrollmentPaymentStatus.PAID,
  })
  paymentStatus: EnrollmentPaymentStatus;

  @Column({
    type: 'enum',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.ACTIVE,
  })
  status: EnrollmentStatus;

  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Column({ type: 'timestamptz' })
  endDate: Date;

  @Column({ length: 64 })
  qrAccessCode: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany(() => GymAccessLog, (log) => log.enrollment)
  accessLogs: GymAccessLog[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
