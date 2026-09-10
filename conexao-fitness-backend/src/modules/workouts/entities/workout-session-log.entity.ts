import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('workout_session_logs')
export class WorkoutSessionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  routineId?: string;

  @Column()
  studentId: string;

  @Column()
  routineTitle: string;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp' })
  finishedAt: Date;

  @Column({ type: 'int', default: 0 })
  durationSeconds: number;

  @Column({ type: 'int', default: 0 })
  completedExercisesCount: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  totalWeightLiftedKg: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;
}
