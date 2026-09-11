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

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'text', nullable: true })
  coverUrl?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ nullable: true })
  zipCode?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  whatsapp?: string;

  @Column({ nullable: true })
  instagram?: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ type: 'jsonb', nullable: true })
  openingHours?: Record<string, string>;

  @Column({ type: 'jsonb', nullable: true })
  facilities?: string[];

  @Column({ type: 'jsonb', nullable: true })
  modalities?: string[];

  @Column({ type: 'jsonb', nullable: true })
  galleryUrls?: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  dayPassPrice?: number;

  @Column({ type: 'text', nullable: true })
  documentUrl?: string;

  @Column({ type: 'uuid', nullable: true })
  subscriptionPlanId?: string;

  @Column({ type: 'float', default: 5.0 })
  qualityScore: number;

  @Column({ type: 'float', default: 100 })
  responseRate: number;
}
