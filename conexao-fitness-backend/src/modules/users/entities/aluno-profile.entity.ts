import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('aluno_profiles')
export class AlunoProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (u) => u.alunoProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  fullName: string;

  @Column({ type: 'jsonb', nullable: true })
  preferredModalities?: string[];

  @Column({ type: 'jsonb', nullable: true })
  notificationsConfig?: Record<string, any>;
}
