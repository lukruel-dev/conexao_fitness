import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';


@Entity('academia_profiles')
export class AcademiaProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (u) => u.academiaProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  razaoSocial: string;

  @Column()
  nomeFantasia: string;

  @Column()
  cnpj: string;

  @Column({ nullable: true })
  documentUrl?: string;

  @Column({ type: 'uuid', nullable: true })
  subscriptionPlanId?: string;

  @Column({ type: 'float', default: 0 })
  qualityScore: number;

  @Column({ type: 'float', default: 0 })
  responseRate: number;
}
