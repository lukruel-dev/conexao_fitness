import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WorkoutRoutine } from './workout-routine.entity';

@Entity('workout_exercises')
export class WorkoutExercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  routineId: string;

  @ManyToOne(() => WorkoutRoutine, (r) => r.exercises, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routineId' })
  routine: WorkoutRoutine;

  @Column({ type: 'int', default: 1 })
  order: number;

  @Column()
  name: string; // Ex: 'Supino Reto com Barra'

  @Column({ nullable: true })
  muscleGroup?: string; // Ex: 'Peitoral'

  @Column({ type: 'int', default: 3 })
  sets: number; // Ex: 4 séries

  @Column({ default: '10-12' })
  reps: string; // Ex: '10-12' ou '15' ou 'Até a falha'

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  targetWeightKg: number; // Ex: 40.00 kg

  @Column({ type: 'int', default: 60 })
  restSeconds: number; // Ex: 60s descanso

  @Column({ type: 'text', nullable: true })
  notes?: string; // Instruções de execução

  @Column({ nullable: true })
  videoUrl?: string; // Link demonstrativo

  @CreateDateColumn()
  createdAt: Date;
}
