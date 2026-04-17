import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Service } from './service.entity';
import { ScheduleSlotStatus } from '../enums/schedule-slot-status.enum';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('schedule_slots')
export class ScheduleSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  serviceId: string;

  @ManyToOne(() => Service, (service) => service.slots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'timestamptz' })
  endsAt: Date;

  @Column({
    type: 'enum',
    enum: ScheduleSlotStatus,
    default: ScheduleSlotStatus.AVAILABLE,
  })
  status: ScheduleSlotStatus;

  @Column({ type: 'uuid', nullable: true })
  studentId: string | null;

  @OneToMany(() => Booking, (booking) => booking.slot)
  bookings: Booking[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}