import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type WalletTransactionType =
  | 'CREDIT'
  | 'DEBIT'
  | 'WITHDRAWAL'
  | 'TOPUP'
  | 'DAY_PASS'
  | 'ENROLLMENT'
  | 'BOOKING'
  | 'REFUND';

export type WalletTransactionStatus = 'COMPLETED' | 'PENDING' | 'CANCELED' | 'FAILED';

@Entity({ name: 'wallet_transactions' })
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string; // The owner of this transaction (the gym, professional, or student)

  @Column({ type: 'varchar' })
  type: WalletTransactionType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: string; // Gross or transacted amount

  @Column({ type: 'decimal', precision: 12, scale: 2, default: '0.00' })
  fee: string; // Platform fee

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  netAmount: string; // Net credited or debited amount

  @Column({ type: 'varchar', default: 'COMPLETED' })
  status: WalletTransactionStatus;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'source_user_id', nullable: true })
  sourceUserId?: string; // Student ID who paid

  @Column({ name: 'source_user_name', nullable: true })
  sourceUserName?: string; // Student name

  @Column({ name: 'source_user_avatar', type: 'text', nullable: true })
  sourceUserAvatar?: string;

  @Column({ name: 'target_user_id', nullable: true })
  targetUserId?: string; // Gym or Personal ID

  @Column({ name: 'reference_type', nullable: true })
  referenceType?: string; // 'DAY_PASS', 'ENROLLMENT', 'BOOKING', 'TOPUP', 'WITHDRAWAL'

  @Column({ name: 'reference_id', nullable: true })
  referenceId?: string;

  @Column({ name: 'payment_method', nullable: true })
  paymentMethod?: string; // 'FINEX_WALLET', 'STRIPE', 'PIX', 'MANUAL'

  @Column({ name: 'pix_key', nullable: true })
  pixKey?: string;

  @Column({ name: 'pix_key_type', nullable: true })
  pixKeyType?: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
