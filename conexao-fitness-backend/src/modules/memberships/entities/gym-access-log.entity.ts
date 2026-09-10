import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GymEnrollment } from './gym-enrollment.entity';

export enum AccessStatus {
  GRANTED = 'GRANTED',
  DENIED = 'DENIED',
}

@Entity('gym_access_logs')
@Index('IDX_gym_access_logs_academia', ['academiaId'])
@Index('IDX_gym_access_logs_student', ['studentId'])
@Index('IDX_gym_access_logs_accessed_at', ['accessedAt'])
export class GymAccessLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  enrollmentId?: string;

  @ManyToOne(() => GymEnrollment, (e) => e.accessLogs, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'enrollmentId' })
  enrollment?: GymEnrollment;

  @Column({ type: 'uuid', nullable: true })
  studentId?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'studentId' })
  student?: User;

  @Column({ type: 'uuid' })
  academiaId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'academiaId' })
  academia: User;

  @Column({
    type: 'enum',
    enum: AccessStatus,
    default: AccessStatus.GRANTED,
  })
  status: AccessStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  denialReason?: string;

  @Column({ type: 'varchar', length: 100, default: 'Catraca Principal' })
  deviceInfo: string;

  @CreateDateColumn({ type: 'timestamptz' })
  accessedAt: Date;
}
