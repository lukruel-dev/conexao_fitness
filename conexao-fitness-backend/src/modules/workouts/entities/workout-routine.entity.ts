import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkoutExercise } from './workout-exercise.entity';

@Entity('workout_routines')
export class WorkoutRoutine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  studentId: string;

  @Column({ nullable: true })
  creatorId?: string; // Personal Trainer ou Academia que prescreveu

  @Column()
  title: string; // Ex: 'Treino A - Peito & Tríceps'

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  dayOfWeek?: string; // Ex: 'Segunda-feira' ou 'Treino A'

  @Column('simple-array', { nullable: true })
  targetMuscleGroups: string[]; // Ex: ['Peito', 'Tríceps', 'Ombros']

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => WorkoutExercise, (e) => e.routine, { cascade: true, eager: true })
  exercises: WorkoutExercise[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
