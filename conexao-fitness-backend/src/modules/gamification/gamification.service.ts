import {
  BadRequestException,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { UserGamification } from './entities/user-gamification.entity';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { PointTransaction } from './entities/point-transaction.entity';

export const MYSTERY_BOX_PRIZES = [
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

@Injectable()
export class GamificationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    @InjectRepository(UserGamification)
    private readonly gamificationRepo: Repository<UserGamification>,
    @InjectRepository(Badge)
    private readonly badgeRepo: Repository<Badge>,
    @InjectRepository(UserBadge)
    private readonly userBadgeRepo: Repository<UserBadge>,
    @InjectRepository(PointTransaction)
    private readonly pointTxRepo: Repository<PointTransaction>,
  ) {}

  async onApplicationBootstrap() {
    try {
      await this.seedDefaultBadges();
    } catch (err) {
      this.logger.error('Erro ao inicializar badges de gamificação:', err);
    }
  }

  private async seedDefaultBadges() {
    const defaultBadges = [
      {
        code: 'first_workout',
        title: 'Primeiro Passo',
        description: 'Concluiu seu primeiro treino ou check-in no Finex!',
        icon: 'Dumbbell',
        pinEmoji: '🏋️',
        category: 'MILESTONE' as const,
        pointsReward: 50,
      },
      {
        code: 'streak_3',
        title: 'Pegando o Ritmo',
        description: 'Manteve uma sequência de 3 dias seguidos de treino.',
        icon: 'Flame',
        pinEmoji: '🔥',
        category: 'STREAK' as const,
        pointsReward: 100,
      },
      {
        code: 'streak_7',
        title: 'Guerreiro da Semana',
        description: 'Completou 7 dias seguidos de treino e foco!',
        icon: 'Zap',
        pinEmoji: '⚡',
        category: 'STREAK' as const,
        pointsReward: 200,
      },
      {
        code: 'streak_30',
        title: 'Lenda do Fitness',
        description: 'Alcançou 30 dias consecutivos de disciplina de ferro!',
        icon: 'Trophy',
        pinEmoji: '👑',
        category: 'STREAK' as const,
        pointsReward: 500,
      },
      {
        code: 'workouts_10',
        title: 'Foco de Ferro (10 Treinos)',
        description: 'Completou 10 treinos no ecossistema Finex.',
        icon: 'Award',
        pinEmoji: '🛡️',
        category: 'MILESTONE' as const,
        pointsReward: 150,
      },
      {
        code: 'workouts_50',
        title: 'Veterano dos Treinos (50 Treinos)',
        description: 'Completou 50 treinos registrados no Finex!',
        icon: 'Crown',
        pinEmoji: '🏆',
        category: 'MILESTONE' as const,
        pointsReward: 400,
      },
      {
        code: 'workouts_100',
        title: 'Centurião Finex (100 Treinos)',
        description: 'Completou 100 treinos! Atleta de elite.',
        icon: 'Sparkles',
        pinEmoji: '💎',
        category: 'MILESTONE' as const,
        pointsReward: 1000,
      },
      {
        code: 'points_collector',
        title: 'Colecionador de Pontos',
        description: 'Acumulou mais de 500 pontos no clube de recompensas.',
        icon: 'Sparkles',
        pinEmoji: '⭐',
        category: 'COMMUNITY' as const,
        pointsReward: 100,
      },
      {
        code: 'mystery_box_opened',
        title: 'Caçador de Brindes',
        description: 'Abriu sua primeira Caixa Misteriosa Finex!',
        icon: 'Package',
        pinEmoji: '🎁',
        category: 'COMMUNITY' as const,
        pointsReward: 100,
      },
      {
        code: 'friend_invited',
        title: 'Parceria de Treino',
        description: 'Presenteou um amigo com um Day Pass Cortesia!',
        icon: 'Users',
        pinEmoji: '🤝',
        category: 'COMMUNITY' as const,
        pointsReward: 100,
      },
    ];

    for (const b of defaultBadges) {
      let badge = await this.badgeRepo.findOne({ where: { code: b.code } });
      if (!badge) {
        badge = this.badgeRepo.create(b);
        await this.badgeRepo.save(badge);
      } else if (!badge.pinEmoji || badge.pinEmoji !== b.pinEmoji) {
        badge.pinEmoji = b.pinEmoji;
        badge.title = b.title;
        badge.description = b.description;
        await this.badgeRepo.save(badge);
      }
    }
  }

  async getOrCreateGamification(userId: string): Promise<UserGamification> {
    let record = await this.gamificationRepo.findOne({ where: { userId } });
    if (!record) {
      record = this.gamificationRepo.create({
        userId,
        currentStreak: 0,
        longestStreak: 0,
        totalWorkouts: 0,
        pointsBalance: 100, // Bônus de boas-vindas
        lifetimePoints: 100,
        weeklyGoal: 4,
        equippedBadgeCode: 'first_workout',
        equippedPinEmoji: '🏋️',
      });
      record = await this.gamificationRepo.save(record);

      await this.pointTxRepo.save(
        this.pointTxRepo.create({
          userId,
          amount: 100,
          type: 'EARNED_BADGE',
          description: 'Bônus de boas-vindas Finex',
        }),
      );
    }
    return record;
  }

  async getGamificationSummary(userId: string) {
    await this.seedDefaultBadges();
    const gamification = await this.getOrCreateGamification(userId);

    // Avaliar e desbloquear conquistas pendentes
    await this.checkAndAwardBadges(userId, gamification);

    const userBadges = await this.userBadgeRepo.find({
      where: { userId },
      relations: ['badge'],
      order: { unlockedAt: 'DESC' },
    });
    const allBadges = await this.badgeRepo.find({ order: { pointsReward: 'ASC' } });
    const recentTransactions = await this.pointTxRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 15,
    });

    // Verificar se já resgatou o Day Pass para amigo no mês atual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const usedFriendPassThisMonth = await this.pointTxRepo.findOne({
      where: {
        userId,
        type: 'REDEEMED_FRIEND_DAYPASS',
        createdAt: MoreThanOrEqual(startOfMonth),
      },
    });

    const unlockedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));
    const badgesWithStatus = allBadges.map((badge) => ({
      ...badge,
      isUnlocked: unlockedBadgeIds.has(badge.id),
      unlockedAt: userBadges.find((ub) => ub.badgeId === badge.id)?.unlockedAt || null,
      isEquipped: gamification.equippedBadgeCode === badge.code,
    }));

    return {
      gamification,
      badges: badgesWithStatus,
      equippedBadge: {
        code: gamification.equippedBadgeCode,
        pinEmoji: gamification.equippedPinEmoji || '🏅',
      },
      recentTransactions,
      monthlyFriendPass: {
        canRedeem: !usedFriendPassThisMonth,
        usedAt: usedFriendPassThisMonth?.createdAt || null,
        cost: 300,
        limitPerMonth: 1,
      },
      mysteryBox: {
        cost: 1000,
        availablePrizes: MYSTERY_BOX_PRIZES,
        canOpen: gamification.pointsBalance >= 1000,
      },
    };
  }

  async equipBadge(userId: string, badgeCode: string | null) {
    const gamification = await this.getOrCreateGamification(userId);

    if (!badgeCode) {
      gamification.equippedBadgeCode = null;
      gamification.equippedPinEmoji = null;
      await this.gamificationRepo.save(gamification);
      return {
        success: true,
        message: 'Pin removido do perfil.',
        equippedBadgeCode: null,
        equippedPinEmoji: null,
      };
    }

    const badge = await this.badgeRepo.findOne({ where: { code: badgeCode } });
    if (!badge) {
      throw new BadRequestException('Conquista não encontrada.');
    }

    const userBadge = await this.userBadgeRepo.findOne({
      where: { userId, badgeId: badge.id },
    });

    // Se o usuário ainda não tiver o registro mas cumprir o critério, avalia
    if (!userBadge && gamification.totalWorkouts === 0 && badgeCode === 'first_workout') {
      // libera o primeiro badge como incentivo
      const ub = this.userBadgeRepo.create({ userId, badgeId: badge.id });
      await this.userBadgeRepo.save(ub);
    } else if (!userBadge) {
      throw new BadRequestException('Você precisa desbloquear esta conquista antes de equipar o pin.');
    }

    gamification.equippedBadgeCode = badge.code;
    gamification.equippedPinEmoji = badge.pinEmoji || '🏅';
    await this.gamificationRepo.save(gamification);

    return {
      success: true,
      message: `Pin "${badge.title}" ${badge.pinEmoji} equipado no seu perfil!`,
      equippedBadgeCode: badge.code,
      equippedPinEmoji: badge.pinEmoji,
      badgeTitle: badge.title,
    };
  }

  async recordActivity(
    userId: string,
    type: 'CHECKIN' | 'WORKOUT' | 'ENROLLMENT',
    description?: string,
  ): Promise<{ gamification: UserGamification; pointsEarned: number; newBadges: Badge[] }> {
    const gamification = await this.getOrCreateGamification(userId);
    const todayStr = new Date().toISOString().split('T')[0];

    let pointsToAdd = 50;
    let txType: any = 'EARNED_CHECKIN';
    let txDesc = description || 'Check-in na academia';

    if (type === 'WORKOUT') {
      pointsToAdd = 50;
      txType = 'EARNED_WORKOUT';
      txDesc = description || 'Treino concluído com sucesso';
    } else if (type === 'ENROLLMENT') {
      pointsToAdd = 250;
      txType = 'EARNED_ENROLLMENT';
      txDesc = description || 'Matrícula ou renovação de plano';
    }

    // Atualização de Streak
    if (gamification.lastWorkoutDate !== todayStr) {
      if (!gamification.lastWorkoutDate) {
        gamification.currentStreak = 1;
      } else {
        const lastDate = new Date(gamification.lastWorkoutDate);
        const today = new Date(todayStr);
        const diffDays = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          gamification.currentStreak += 1;
        } else if (diffDays > 1) {
          gamification.currentStreak = 1;
        }
      }
      gamification.lastWorkoutDate = todayStr;
      gamification.totalWorkouts += 1;
      gamification.longestStreak = Math.max(gamification.longestStreak, gamification.currentStreak);
    }

    // Creditar pontos
    gamification.pointsBalance += pointsToAdd;
    gamification.lifetimePoints += pointsToAdd;

    await this.gamificationRepo.save(gamification);

    await this.pointTxRepo.save(
      this.pointTxRepo.create({
        userId,
        amount: pointsToAdd,
        type: txType,
        description: txDesc,
      }),
    );

    // Avaliar Badges desbloqueados
    const newBadges = await this.checkAndAwardBadges(userId, gamification);

    return {
      gamification,
      pointsEarned: pointsToAdd,
      newBadges,
    };
  }

  private async checkAndAwardBadges(
    userId: string,
    gamification: UserGamification,
  ): Promise<Badge[]> {
    const userBadges = await this.userBadgeRepo.find({ where: { userId } });
    const unlockedCodes = new Set(userBadges.map((ub) => ub.badge?.code).filter(Boolean));
    const newlyUnlocked: Badge[] = [];

    const checkBadge = async (code: string) => {
      if (unlockedCodes.has(code)) return;
      const badge = await this.badgeRepo.findOne({ where: { code } });
      if (badge) {
        const ub = this.userBadgeRepo.create({ userId, badgeId: badge.id });
        await this.userBadgeRepo.save(ub);
        newlyUnlocked.push(badge);

        if (badge.pointsReward > 0) {
          gamification.pointsBalance += badge.pointsReward;
          gamification.lifetimePoints += badge.pointsReward;
          await this.gamificationRepo.save(gamification);

          await this.pointTxRepo.save(
            this.pointTxRepo.create({
              userId,
              amount: badge.pointsReward,
              type: 'EARNED_BADGE',
              description: `Conquista desbloqueada: ${badge.title}`,
            }),
          );
        }
      }
    };

    if (gamification.totalWorkouts >= 1) await checkBadge('first_workout');
    if (gamification.currentStreak >= 3) await checkBadge('streak_3');
    if (gamification.currentStreak >= 7) await checkBadge('streak_7');
    if (gamification.currentStreak >= 30) await checkBadge('streak_30');
    if (gamification.totalWorkouts >= 10) await checkBadge('workouts_10');
    if (gamification.totalWorkouts >= 50) await checkBadge('workouts_50');
    if (gamification.lifetimePoints >= 500) await checkBadge('points_collector');

    return newlyUnlocked;
  }

  async redeemPoints(
    userId: string,
    dto: { type: 'FRIEND_DAY_PASS' | 'MYSTERY_BOX' | 'WALLET_CASH' | 'DAY_PASS'; pointsAmount?: number },
  ) {
    const gamification = await this.getOrCreateGamification(userId);

    // Bloqueia resgate de dinheiro / cashback
    if (dto.type === 'WALLET_CASH') {
      throw new BadRequestException(
        'O Finex Points não possui resgate em dinheiro. Utilize seus pontos para o Day Pass de Amigo (1x/mês) ou para abrir a Caixa Misteriosa Finex (1.000 pts)!',
      );
    }

    if (dto.type === 'FRIEND_DAY_PASS' || dto.type === 'DAY_PASS') {
      const FRIEND_PASS_COST = 300;

      // Validação de 1x por mês
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const usedThisMonth = await this.pointTxRepo.findOne({
        where: {
          userId,
          type: 'REDEEMED_FRIEND_DAYPASS',
          createdAt: MoreThanOrEqual(startOfMonth),
        },
      });

      if (usedThisMonth) {
        throw new BadRequestException(
          'Você já utilizou o seu Day Pass para amigo este mês. O benefício é renovado no primeiro dia de cada mês!',
        );
      }

      if (gamification.pointsBalance < FRIEND_PASS_COST) {
        throw new BadRequestException(
          `Saldo insuficiente. O Day Pass para amigo custa ${FRIEND_PASS_COST} pontos (você tem ${gamification.pointsBalance} pts).`,
        );
      }

      gamification.pointsBalance -= FRIEND_PASS_COST;
      await this.gamificationRepo.save(gamification);

      const voucherCode = `AMIGO-FINEX-${Math.floor(100000 + Math.random() * 900000)}`;

      await this.pointTxRepo.save(
        this.pointTxRepo.create({
          userId,
          amount: -FRIEND_PASS_COST,
          type: 'REDEEMED_FRIEND_DAYPASS',
          description: `Resgate de Day Pass para Amigo (${voucherCode})`,
        }),
      );

      return {
        success: true,
        rewardType: 'FRIEND_DAY_PASS',
        voucherCode,
        message: 'Day Pass para amigo resgatado com sucesso! Compartilhe o código com seu amigo.',
        shareText: `E aí! Ganhei um Day Pass cortesia no Conexão Fitness para você treinar comigo. Apresente este código na recepção: ${voucherCode}`,
        newPointsBalance: gamification.pointsBalance,
      };
    } else if (dto.type === 'MYSTERY_BOX') {
      const MYSTERY_BOX_COST = 1000;

      if (gamification.pointsBalance < MYSTERY_BOX_COST) {
        throw new BadRequestException(
          `A Caixa Misteriosa Finex requer 1.000 pontos. Você possui ${gamification.pointsBalance} pontos acumulados.`,
        );
      }

      gamification.pointsBalance -= MYSTERY_BOX_COST;
      await this.gamificationRepo.save(gamification);

      // Sorteio de brinde oficial do mês
      const randomIndex = Math.floor(Math.random() * MYSTERY_BOX_PRIZES.length);
      const prize = MYSTERY_BOX_PRIZES[randomIndex];
      const voucherCode = `MBOX-FINEX-${Math.floor(100000 + Math.random() * 900000)}`;

      await this.pointTxRepo.save(
        this.pointTxRepo.create({
          userId,
          amount: -MYSTERY_BOX_COST,
          type: 'REDEEMED_MYSTERY_BOX',
          description: `Caixa Misteriosa Finex: ${prize.name} (${voucherCode})`,
        }),
      );

      return {
        success: true,
        rewardType: 'MYSTERY_BOX',
        prize,
        voucherCode,
        message: `Parabéns! Você abriu a Caixa Misteriosa e ganhou: ${prize.name}!`,
        instructions:
          'Apresente o voucher gerado na recepção da sua academia credenciada ou envie para o suporte Finex para combinar a entrega do seu brinde.',
        newPointsBalance: gamification.pointsBalance,
      };
    }

    throw new BadRequestException('Tipo de recompensa inválido.');
  }
}
