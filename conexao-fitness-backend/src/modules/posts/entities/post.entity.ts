import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PostLike } from './post-like.entity';
import { PostComment } from './post-comment.entity';

@Entity('posts')
@Index('IDX_posts_author_id', ['authorId'])
@Index('IDX_posts_created_at', ['createdAt'])
@Index('IDX_posts_category', ['category'])
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 60, default: 'Geral' })
  category: string; // Ex: Treino, Dieta, Dicas, Dúvidas, Evolução

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  tags: string[]; // Ex: ["#Treino", "#Hipertrofia"]

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  mediaUrls: string[]; // Lista de fotos anexadas

  @Column({ type: 'jsonb', nullable: true })
  workoutRoutine?: {
    title?: string;
    level?: string;
    exercises?: Array<{
      name: string;
      sets?: string;
      reps?: string;
      restSeconds?: number;
      notes?: string;
    }>;
  };

  @Column({ type: 'int', default: 0 })
  likesCount: number;

  @Column({ type: 'int', default: 0 })
  commentsCount: number;

  @OneToMany(() => PostLike, (like) => like.post)
  likes: PostLike[];

  @OneToMany(() => PostComment, (comment) => comment.post)
  comments: PostComment[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
