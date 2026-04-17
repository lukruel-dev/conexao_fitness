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
    default: 0,
  })
  currentBalance: string;

  @Column({ default: 'ACTIVE' })
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
}