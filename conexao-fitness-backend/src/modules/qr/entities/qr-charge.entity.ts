import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type QRStatus = 'PENDING' | 'PAID' | 'CANCELED' | 'EXPIRED';

@Entity({ name: 'qr_charges' })
export class QRCharge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  providerId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: string;

  @Column({ default: 'BRL' })
  currency: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'varchar', default: 'PENDING' })
  status: QRStatus;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  updatedAt: Date | null;
}