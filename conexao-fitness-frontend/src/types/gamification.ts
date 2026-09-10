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

export interface MysteryPrize {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
}

export interface MonthlyFriendPassInfo {
  canRedeem: boolean;
  usedAt: string | null;
  cost: number;
  limitPerMonth: number;
}

export interface MysteryBoxInfo {
  cost: number;
  availablePrizes: MysteryPrize[];
  canOpen: boolean;
}

export interface GamificationSummary {
  gamification: UserGamification;
  badges: Badge[];
  recentTransactions: PointTransaction[];
  monthlyFriendPass?: MonthlyFriendPassInfo;
  mysteryBox?: MysteryBoxInfo;
}

export interface RedeemRewardDto {
  type: 'FRIEND_DAY_PASS' | 'MYSTERY_BOX';
  pointsAmount?: number;
}

export interface RedeemRewardResponse {
  success: boolean;
  rewardType: 'FRIEND_DAY_PASS' | 'MYSTERY_BOX';
  voucherCode: string;
  message: string;
  shareText?: string;
  prize?: MysteryPrize;
  instructions?: string;
  newPointsBalance: number;
}
