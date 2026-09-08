export type UserRole = 'STUDENT' | 'PERSONAL' | 'ACADEMIA' | 'ADMIN';

export interface PostAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  cityBase?: string;
  averageRating?: number;
  personalProfile?: {
    professionTitle?: string;
    cref?: string;
  };
  academiaProfile?: {
    nomeFantasia?: string;
  };
}

export interface ExerciseItem {
  name: string;
  sets?: string;
  reps?: string;
  restSeconds?: number;
  notes?: string;
}

export interface WorkoutRoutine {
  title?: string;
  level?: string;
  exercises?: ExerciseItem[];
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  author?: PostAuthor;
  content: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  author?: PostAuthor;
  content: string;
  category: string;
  tags: string[];
  mediaUrls: string[];
  workoutRoutine?: WorkoutRoutine;
  likesCount: number;
  commentsCount: number;
  sharesCount?: number;
  sharedPostId?: string;
  sharedPost?: Post;
  isLiked?: boolean;
  isFollowingAuthor?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePostDto {
  content: string;
  category?: string;
  tags?: string[];
  mediaUrls?: string[];
  sharedPostId?: string;
  workoutRoutine?: WorkoutRoutine;
}

export interface CreateCommentDto {
  content: string;
}
