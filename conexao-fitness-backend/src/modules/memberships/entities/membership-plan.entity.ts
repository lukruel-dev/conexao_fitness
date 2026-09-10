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

export enum PlanRecurrence {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMIANNUAL = 'SEMIANNUAL',
  ANNUAL = 'ANNUAL',
  SINGLE = 'SINGLE',
}

@Entity('membership_plans')
@Index('IDX_membership_plans_academia', ['academiaId'])
export class MembershipPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  academiaId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'academiaId' })
  academia: User;

  @Column({ length: 120 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: string;

  @Column({ type: 'int', default: 30 })
  durationDays: number;

  @Column({
    type: 'enum',
    enum: PlanRecurrence,
    default: PlanRecurrence.MONTHLY,
  })
  recurrence: PlanRecurrence;

  @Column({ type: 'simple-array', nullable: true })
  modalities?: string[];

  @Column({ type: 'simple-array', nullable: true })
  benefits?: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
