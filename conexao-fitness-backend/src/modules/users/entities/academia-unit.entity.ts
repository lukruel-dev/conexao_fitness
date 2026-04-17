import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { AcademiaProfile } from './academia-profile.entity';

@Entity('academia_units')
export class AcademiaUnit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AcademiaProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'academia_id' })
  academia: AcademiaProfile;

  @Column({ name: 'academia_id' })
  academiaId: string;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column()
  city: string;

  @Column({ nullable: true })
  zipCode?: string;

  @Column({ type: 'double precision', nullable: true })
  lat?: number;

  @Column({ type: 'double precision', nullable: true })
  lng?: number;

  @Column({ type: 'jsonb', nullable: true })
  openingHours?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  facilities?: string[];
}
