import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type BadgeCategory = 'STREAK' | 'MILESTONE' | 'COMMUNITY' | 'EXPLORER';

@Entity('badges')
export class Badge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  icon: string; // Lucide icon name, e.g. 'Flame', 'Trophy', 'Zap', 'Dumbbell'

  @Column({ type: 'varchar', default: 'MILESTONE' })
  category: BadgeCategory;

  @Column({ type: 'int', default: 50 })
  pointsReward: number;

  @Column({ type: 'varchar', default: '🏅' })
  pinEmoji: string;

  @CreateDateColumn()
  createdAt: Date;
}
