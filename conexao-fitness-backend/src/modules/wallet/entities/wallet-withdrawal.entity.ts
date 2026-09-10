import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type WithdrawalStatus = 'COMPLETED' | 'PROCESSING' | 'PENDING' | 'REJECTED';

@Entity({ name: 'wallet_withdrawals' })
export class WalletWithdrawal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: '0.00' })
  fee: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  netAmount: string;

  @Column({ name: 'pix_key_type' })
  pixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';

  @Column({ name: 'pix_key' })
  pixKey: string;

  @Column({ name: 'holder_name', nullable: true })
  holderName?: string;

  @Column({ name: 'bank_name', nullable: true })
  bankName?: string;

  @Column({ type: 'varchar', default: 'COMPLETED' })
  status: WithdrawalStatus;

  @Column({ name: 'transfer_protocol' })
  transferProtocol: string;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt?: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
