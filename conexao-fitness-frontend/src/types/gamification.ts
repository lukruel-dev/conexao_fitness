export interface UserGamification {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
  totalWorkouts: number;
  pointsBalance: number;
  lifetimePoints: number;
  weeklyGoal: number;
  createdAt: string;
  updatedAt: string;
}

export interface Badge {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  category: 'STREAK' | 'MILESTONE' | 'COMMUNITY' | 'EXPLORER';
  pointsReward: number;
  isUnlocked?: boolean;
  unlockedAt?: string | null;
}

export interface PointTransaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export interface GamificationSummary {
  gamification: UserGamification;
  badges: Badge[];
  recentTransactions: PointTransaction[];
}
