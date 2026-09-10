import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Badge } from './badge.entity';

@Entity('user_badges')
@Unique(['userId', 'badgeId'])
export class UserBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  badgeId: string;

  @ManyToOne(() => Badge, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'badgeId' })
  badge: Badge;

  @CreateDateColumn()
  unlockedAt: Date;
}
