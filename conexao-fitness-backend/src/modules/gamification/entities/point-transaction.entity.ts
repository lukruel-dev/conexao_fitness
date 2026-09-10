import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type PointTransactionType =
  | 'EARNED_CHECKIN'
  | 'EARNED_WORKOUT'
  | 'EARNED_ENROLLMENT'
  | 'EARNED_BADGE'
  | 'REDEEMED_WALLET'
  | 'REDEEMED_DAYPASS';

@Entity('point_transactions')
export class PointTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'int' })
  amount: number; // positive for earn, negative for redeem

  @Column({ type: 'varchar' })
  type: PointTransactionType;

  @Column()
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}
