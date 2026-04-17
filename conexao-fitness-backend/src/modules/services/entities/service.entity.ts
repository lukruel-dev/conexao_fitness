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