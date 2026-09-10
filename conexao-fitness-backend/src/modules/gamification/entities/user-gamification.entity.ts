import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_gamification')
export class UserGamification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column({ type: 'int', default: 0 })
  currentStreak: number;

  @Column({ type: 'int', default: 0 })
  longestStreak: number;

  @Column({ type: 'date', nullable: true })
  lastWorkoutDate: string | null;

  @Column({ type: 'int', default: 0 })
  totalWorkouts: number;

  @Column({ type: 'int', default: 0 })
  pointsBalance: number;

  @Column({ type: 'int', default: 0 })
  lifetimePoints: number;

  @Column({ type: 'int', default: 4 })
  weeklyGoal: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
