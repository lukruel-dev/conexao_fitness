import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ServiceType } from '../../services/entities/service.entity';

@Entity('service_catalog')
export class ServiceCatalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ length: 80 })
  modality: string;

  @Column({ type: 'int', default: 60 })
  durationMinutes: number;

  @Column({
    type: 'enum',
    enum: ServiceType,
    default: ServiceType.SESSAO,
  })
  type: ServiceType;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
