import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type PaymentMethod = 'PIX' | 'CARD';
export type PaymentPurpose = 'WALLET_TOPUP' | 'SUBSCRIPTION' | 'OTHER';
export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';

@Entity({ name: 'payment_intents' })
export class PaymentIntent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  payerUserId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: string;

  @Column({ default: 'BRL' })
  currency: string;

  @Column({ type: 'varchar' })
  method: PaymentMethod;

  @Column({ type: 'varchar', default: 'WALLET_TOPUP' })
  purpose: PaymentPurpose;

  @Column({ nullable: true })
  gateway: string; // ex: PAGARME, PAGBRASIL (no futuro)

  @Column({ nullable: true })
  gatewayReferenceId: string;

  @Column({ type: 'varchar', default: 'PENDING' })
  status: PaymentStatus;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  updatedAt: Date;
}