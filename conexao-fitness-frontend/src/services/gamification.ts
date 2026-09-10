import { apiRequest } from '@/lib/apiClient';
import type {
  GamificationSummary,
  RedeemRewardDto,
  RedeemRewardResponse,
  Badge,
} from '@/types/gamification';

export const DEFAULT_BADGES_CATALOG: Badge[] = [
  {
    id: 'badge-1',
    code: 'first_workout',
    title: 'Primeiro Passo',
    description: 'Concluiu seu primeiro treino ou check-in no Finex!',
    icon: 'Dumbbell',
    pinEmoji: '🏋️',
    category: 'MILESTONE',
    pointsReward: 50,
  },
  {
    id: 'badge-2',
    code: 'streak_3',
    title: 'Pegando o Ritmo',
    description: 'Manteve uma sequência de 3 dias seguidos de treino.',
    icon: 'Flame',
    pinEmoji: '🔥',
    category: 'STREAK',
    pointsReward: 100,
  },
  {
    id: 'badge-3',
    code: 'streak_7',
    title: 'Guerreiro da Semana',
    description: 'Completou 7 dias seguidos de treino e foco!',
    icon: 'Zap',
    pinEmoji: '⚡',
    category: 'STREAK',
    pointsReward: 200,
  },
  {
    id: 'badge-4',
    code: 'streak_30',
    title: 'Lenda do Fitness',
    description: 'Alcançou 30 dias consecutivos de disciplina de ferro!',
    icon: 'Trophy',
    pinEmoji: '👑',
    category: 'STREAK',
    pointsReward: 500,
  },
  {
    id: 'badge-5',
    code: 'workouts_10',
    title: 'Foco de Ferro (10 Treinos)',
    description: 'Completou 10 treinos no ecossistema Finex.',
    icon: 'Award',
    pinEmoji: '🛡️',
    category: 'MILESTONE',
    pointsReward: 150,
  },
  {
    id: 'badge-6',
    code: 'workouts_50',
    title: 'Veterano dos Treinos (50 Treinos)',
    description: 'Completou 50 treinos registrados no Finex!',
    icon: 'Crown',
    pinEmoji: '🏆',
    category: 'MILESTONE',
    pointsReward: 400,
  },
  {
    id: 'badge-7',
    code: 'workouts_100',
    title: 'Centurião Finex (100 Treinos)',
    description: 'Completou 100 treinos! Atleta de elite.',
    icon: 'Sparkles',
    pinEmoji: '💎',
    category: 'MILESTONE',
    pointsReward: 1000,
  },
  {
    id: 'badge-8',
    code: 'points_collector',
    title: 'Colecionador de Pontos',
    description: 'Acumulou mais de 500 pontos no clube de recompensas.',
    icon: 'Sparkles',
    pinEmoji: '⭐',
    category: 'COMMUNITY',
    pointsReward: 100,
  },
  {
    id: 'badge-9',
    code: 'mystery_box_opened',
    title: 'Caçador de Brindes',
    description: 'Abriu sua primeira Caixa Misteriosa Finex!',
    icon: 'Package',
    pinEmoji: '🎁',
    category: 'COMMUNITY',
    pointsReward: 100,
  },
  {
    id: 'badge-10',
    code: 'friend_invited',
    title: 'Parceria de Treino',
    description: 'Presenteou um amigo com um Day Pass Cortesia!',
    icon: 'Users',
    pinEmoji: '🤝',
    category: 'COMMUNITY',
    pointsReward: 100,
  },
];

export async function fetchGamificationSummary(): Promise<GamificationSummary> {
  try {
    const summary = await apiRequest<GamificationSummary>('/gamification/summary');
    if (!summary.badges || summary.badges.length === 0) {
      summary.badges = DEFAULT_BADGES_CATALOG.map((b) => ({
        ...b,
        isUnlocked: (summary.gamification?.totalWorkouts || 0) > 0 && b.code === 'first_workout',
      }));
    }
    return summary;
  } catch {
    const localUser = localStorage.getItem('cf_user');
    const u = localUser ? JSON.parse(localUser) : null;
    const streak = Number(localStorage.getItem('cf_streak') || '3');
    const workouts = Number(localStorage.getItem('cf_workouts') || '5');
    const equippedPin = localStorage.getItem('cf_equipped_pin') || '⚡';
    const equippedCode = localStorage.getItem('cf_equipped_badge') || 'streak_7';

    const badges = DEFAULT_BADGES_CATALOG.map((b) => {
      let isUnlocked = false;
      if (b.code === 'first_workout' && workouts >= 1) isUnlocked = true;
      if (b.code === 'streak_3' && streak >= 3) isUnlocked = true;
      if (b.code === 'streak_7' && streak >= 7) isUnlocked = true;
      if (b.code === 'streak_30' && streak >= 30) isUnlocked = true;
      if (b.code === 'workouts_10' && workouts >= 10) isUnlocked = true;
      if (b.code === 'workouts_50' && workouts >= 50) isUnlocked = true;
      return {
        ...b,
        isUnlocked,
        isEquipped: b.code === equippedCode,
      };
    });

    return {
      gamification: {
        id: 'local',
        userId: u?.id || '1',
        currentStreak: streak,
        longestStreak: Math.max(streak, 7),
        lastWorkoutDate: new Date().toISOString().split('T')[0],
        totalWorkouts: workouts,
        pointsBalance: 450,
        lifetimePoints: 650,
        weeklyGoal: 4,
        equippedBadgeCode: equippedCode,
        equippedPinEmoji: equippedPin,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      badges,
      equippedBadge: {
        code: equippedCode,
        pinEmoji: equippedPin,
      },
      recentTransactions: [
        {
          id: 'tx-1',
          userId: '1',
          amount: 50,
          type: 'EARNED_WORKOUT',
          description: 'Treino A (Peito & Tríceps) concluído',
          createdAt: new Date().toISOString(),
        },
      ],
      monthlyFriendPass: {
        canRedeem: true,
        usedAt: null,
        cost: 300,
        limitPerMonth: 1,
      },
      mysteryBox: {
        cost: 1000,
        availablePrizes: [],
        canOpen: false,
      },
    };
  }
}

export async function equipBadgePin(badgeCode: string | null): Promise<{
  success: boolean;
  message: string;
  equippedBadgeCode: string | null;
  equippedPinEmoji: string | null;
}> {
  try {
    const res = await apiRequest<any>('/gamification/equip-pin', {
      method: 'POST',
      body: { badgeCode },
    });
    if (res?.equippedPinEmoji) {
      localStorage.setItem('cf_equipped_pin', res.equippedPinEmoji);
      localStorage.setItem('cf_equipped_badge', res.equippedBadgeCode || '');
    } else {
      localStorage.removeItem('cf_equipped_pin');
      localStorage.removeItem('cf_equipped_badge');
    }
    return res;
  } catch (err: any) {
    const badge = DEFAULT_BADGES_CATALOG.find((b) => b.code === badgeCode);
    const pin = badge?.pinEmoji || '🏅';
    if (badgeCode) {
      localStorage.setItem('cf_equipped_pin', pin);
      localStorage.setItem('cf_equipped_badge', badgeCode);
    } else {
      localStorage.removeItem('cf_equipped_pin');
      localStorage.removeItem('cf_equipped_badge');
    }
    return {
      success: true,
      message: badgeCode ? `Pin "${badge?.title}" ${pin} equipado no seu perfil!` : 'Pin desequipado.',
      equippedBadgeCode: badgeCode,
      equippedPinEmoji: badgeCode ? pin : null,
    };
  }
}

export async function recordGamificationActivity(
  type: 'CHECKIN' | 'WORKOUT' | 'ENROLLMENT',
  description?: string,
) {
  return apiRequest<{
    gamification: any;
    pointsEarned: number;
    newBadges: any[];
  }>('/gamification/activity', {
    method: 'POST',
    body: { type, description },
  });
}

export async function redeemFinexPoints(
  dto: RedeemRewardDto,
): Promise<RedeemRewardResponse> {
  return apiRequest<RedeemRewardResponse>('/gamification/redeem', {
    method: 'POST',
    body: dto,
  });
}
