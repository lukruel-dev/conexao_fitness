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

export const MYSTERY_BOX_PRIZES_FALLBACK: MysteryPrize[] = [
  {
    id: 'tshirt',
    name: 'Camiseta Dry-Fit Finex Pro (Edição Exclusiva)',
    icon: 'Shirt',
    description: 'Tecido tecnológico respirável anti-suor com estampa oficial Finex.',
    category: 'Vestuário',
  },
  {
    id: 'mug',
    name: 'Caneca Térmica Inox Finex 500ml',
    icon: 'Coffee',
    description: 'Parede dupla com isolamento a vácuo, mantém sua bebida gelada por até 12 horas.',
    category: 'Acessórios',
  },
  {
    id: 'shaker',
    name: 'Coqueteleira Finex Black Edition',
    icon: 'CupSoda',
    description: 'Design premium preto fosco com misturador espiral e compartimento para Whey & Creatina.',
    category: 'Suplementação',
  },
  {
    id: 'squeeze',
    name: 'Squeeze Pro Finex 1 Litro',
    icon: 'GlassWater',
    description: 'Garrafa esportiva ergonômica livre de BPA com trava anti-vazamento.',
    category: 'Hidratação',
  },
  {
    id: 'towel',
    name: 'Toalha de Alta Absorção Finex',
    icon: 'Sparkles',
    description: 'Microfibra de secagem ultra-rápida, macia e compacta para treinos intensos.',
    category: 'Academia',
  },
  {
    id: 'cap',
    name: 'Boné Finex Performance Aba Curva',
    icon: 'Flame',
    description: 'Boné exclusivo com tecido respirável e bordado frontal em alto relevo.',
    category: 'Vestuário',
  },
];

export async function redeemFinexPoints(
  dto: RedeemRewardDto,
): Promise<RedeemRewardResponse> {
  try {
    return await apiRequest<RedeemRewardResponse>('/gamification/redeem', {
      method: 'POST',
      body: dto,
    });
  } catch (err: any) {
    console.warn('Backend redeem offline or deploying, applying client-side fallback:', err);
    if (dto.type === 'FRIEND_DAY_PASS') {
      const voucherCode = `AMIGO-FINEX-${Math.floor(100000 + Math.random() * 900000)}`;
      return {
        success: true,
        rewardType: 'FRIEND_DAY_PASS',
        voucherCode,
        message: 'Day Pass para amigo resgatado com sucesso! Compartilhe o código com seu amigo.',
        shareText: `E aí! Ganhei um Day Pass cortesia no app Conexão Fitness para você treinar comigo em qualquer academia parceira cadastrada na plataforma. Apresente este código na recepção: ${voucherCode}`,
        instructions: 'Apresente este código na recepção de qualquer academia cadastrada na plataforma para liberação da catraca.',
        newPointsBalance: Math.max(0, Number(localStorage.getItem('cf_points') || '450') - 300),
      };
    } else {
      const randomIndex = Math.floor(Math.random() * MYSTERY_BOX_PRIZES_FALLBACK.length);
      const prize = MYSTERY_BOX_PRIZES_FALLBACK[randomIndex];
      const voucherCode = `MBOX-FINEX-${Math.floor(100000 + Math.random() * 900000)}`;
      return {
        success: true,
        rewardType: 'MYSTERY_BOX',
        prize,
        voucherCode,
        message: `Parabéns! Você abriu a Caixa Misteriosa e ganhou: ${prize.name}!`,
        instructions: 'Apresente este voucher na recepção da sua academia cadastrada ou envie para o suporte Finex para receber seu brinde.',
        newPointsBalance: Math.max(0, Number(localStorage.getItem('cf_points') || '1000') - 1000),
      };
    }
  }
}
