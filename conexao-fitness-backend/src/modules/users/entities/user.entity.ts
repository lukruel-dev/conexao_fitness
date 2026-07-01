import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AlunoProfile } from './aluno-profile.entity';
import { PersonalProfile } from './personal-profile.entity';
import { AcademiaProfile } from './academia-profile.entity';
import { Booking } from '../../bookings/entities/booking.entity';

export type UserRole = 'STUDENT' | 'PERSONAL' | 'ACADEMIA' | 'ADMIN';
export type UserStatus = 'ATIVO' | 'PENDENTE_KYC' | 'SUSPENSO';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', default: '' })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, unique: true })
  phone?: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'varchar', default: 'STUDENT' })
  role: UserRole;

  @Column({ type: 'varchar', default: 'PENDENTE_KYC' })
  status: UserStatus;

  @Column({ nullable: true })
  cityBase?: string;

  @Column({ type: 'double precision', nullable: true })
  lastLat?: number;

  @Column({ type: 'double precision', nullable: true })
  lastLng?: number;

  @Column({ nullable: true })
  stripeAccountId?: string;

  @Column({ type: 'double precision', default: 5.0 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  totalReviews: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => AlunoProfile, (p) => p.user)
  alunoProfile?: AlunoProfile;

  @OneToOne(() => PersonalProfile, (p) => p.user)
  personalProfile?: PersonalProfile;

  @OneToOne(() => AcademiaProfile, (p) => p.user)
  academiaProfile?: AcademiaProfile;

  @OneToMany(() => Booking, (booking) => booking.student)
  bookings: Booking[];
}