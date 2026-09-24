import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ScheduleSlot } from './schedule-slot.entity';
import { Booking } from '../../bookings/entities/booking.entity';

export enum ProviderType {
  PERSONAL = 'PERSONAL',
  ACADEMIA = 'ACADEMIA',
}

export enum ServiceType {
  DIARIA = 'DIARIA',
  SESSAO = 'SESSAO',
  PLANO_MENSAL = 'PLANO_MENSAL',
  DAY_PASS = 'DAY_PASS',
}

export enum AttendanceType {
  PRESENCIAL = 'PRESENCIAL',
  ONLINE = 'ONLINE',
  HIBRIDO = 'HIBRIDO',
}

export enum LocationType {
  ACADEMIA_PARCEIRA = 'ACADEMIA_PARCEIRA',
  ESTABELECIMENTO_EXTERNO = 'ESTABELECIMENTO_EXTERNO',
  DOMICILIO = 'DOMICILIO',
  ONLINE = 'ONLINE',
}

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ProviderType,
  })
  providerType: ProviderType;

  @Column({ type: 'uuid' })
  providerId: string;

  @Column({ type: 'uuid', nullable: true })
  unitId: string | null;

  @Column({ type: 'uuid', nullable: true })
  catalogId: string | null;

  @Column({ length: 120 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ length: 80 })
  modality: string;

  @Column({ type: 'int' })
  durationMinutes: number;

  @Column({
    type: 'enum',
    enum: ServiceType,
  })
  type: ServiceType;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: string;

  @Column({ length: 3, default: 'BRL' })
  currency: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true, default: 'MONTHLY' })
  recurrence?: string | null;

  @Column({ type: 'varchar', nullable: true, default: 'PRESENCIAL' })
  format?: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'PRESENCIAL',
  })
  attendanceType: AttendanceType;

  @Column({
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  locationType?: LocationType | null;

  @Column({ type: 'uuid', nullable: true })
  partnerGymId?: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  locationName?: string | null;

  @Column({ type: 'text', nullable: true })
  locationAddress?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  locationCity?: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  locationState?: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  locationPlaceId?: string | null;

  @Column({ type: 'text', nullable: true })
  onlineInstructions?: string | null;

  @Column({ type: 'simple-array', nullable: true })
  benefits?: string[] | null;

  @Column({ type: 'int', nullable: true, default: 20 })
  maxStudents?: number | null;

  @Column({ type: 'int', nullable: true, default: 1 })
  maxInstallments?: number | null;

  @Column({ type: 'int', nullable: true, default: 1 })
  durationMonths?: number | null;

  @OneToMany(() => ScheduleSlot, (slot) => slot.service, {
    cascade: false,
  })
  slots: ScheduleSlot[];

  @OneToMany(() => Booking, (booking) => booking.service)
  bookings: Booking[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}