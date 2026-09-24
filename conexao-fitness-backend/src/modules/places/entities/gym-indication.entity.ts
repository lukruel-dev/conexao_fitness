import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('gym_indications')
@Index(['placeId', 'userId'], { unique: true, where: '"userId" IS NOT NULL' })
@Index(['placeId', 'userIp'], { unique: true, where: '"userId" IS NULL' })
export class GymIndication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  @Index()
  placeId: string;

  @Column({ type: 'varchar', length: 180 })
  gymName: string;

  @Column({ type: 'text', nullable: true })
  gymAddress: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  city: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  state: string | null;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  userId: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  userIp: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
