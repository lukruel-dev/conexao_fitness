import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('personal_profiles')
export class PersonalProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (u) => u.personalProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  publicName: string;

  @Column({ nullable: true })
  cref?: string;

  @Column({ nullable: true, default: 'Personal Trainer' })
  professionTitle?: string;

  @Column({ nullable: true })
  documentUrl?: string;

  @Column({ nullable: true })
  bio?: string;

  @Column({ type: 'jsonb', nullable: true })
  modalities?: string[];

  @Column({ type: 'int', default: 5 })
  serviceRadiusKm: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  baseHourlyPrice?: string;

  @Column({ type: 'uuid', nullable: true })
  subscriptionPlanId?: string;

  @Column({ type: 'float', default: 0 })
  qualityScore: number;

  @Column({ type: 'float', default: 0 })
  responseRate: number;
}
