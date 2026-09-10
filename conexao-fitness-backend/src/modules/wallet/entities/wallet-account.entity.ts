import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'wallet_accounts' })
export class WalletAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_type' })
  ownerType: 'USER' | 'PROVIDER' | 'PLATFORM';

  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column({ default: 'BRL' })
  currency: string;

  @Column({
    name: 'current_balance',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: '0.00',
  })
  currentBalance: string;

  @Column({
    name: 'pending_balance',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: '0.00',
  })
  pendingBalance: string;

  @Column({ default: 'ACTIVE' })
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';

  @Column({ name: 'pix_key_type', nullable: true })
  pixKeyType?: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';

  @Column({ name: 'pix_key', nullable: true })
  pixKey?: string;

  @Column({ name: 'pix_holder_name', nullable: true })
  pixHolderName?: string;

  @Column({ name: 'bank_name', nullable: true })
  bankName?: string;
}