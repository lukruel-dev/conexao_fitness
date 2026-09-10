import {
  BadRequestException,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserGamification } from './entities/user-gamification.entity';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { PointTransaction } from './entities/point-transaction.entity';
import { WalletService } from '../wallet/wallet.service';

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
    private readonly walletService: WalletService,
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
        category: 'MILESTONE' as const,
        pointsReward: 50,
      },
      {
        code: 'streak_3',
        title: 'Pegando o Ritmo',
        description: 'Manteve uma sequência de 3 dias seguidos de treino.',
        icon: 'Flame',
        category: 'STREAK' as const,
        pointsReward: 100,
      },
      {
        code: 'streak_7',
        title: 'Imparável',
        description: 'Completou 7 dias seguidos de treino e foco!',
        icon: 'Zap',
        category: 'STREAK' as const,
        pointsReward: 200,
      },
      {
        code: 'streak_30',
        title: 'Lenda do Fitness',
        description: 'Alcançou 30 dias consecutivos de disciplina de ferro!',
        icon: 'Trophy',
        category: 'STREAK' as const,
        pointsReward: 500,
      },
      {
        code: 'workouts_10',
        title: 'Foco Total (10 Treinos)',
        description: 'Completou 10 treinos no ecossistema Finex.',
        icon: 'Award',
        category: 'MILESTONE' as const,
        pointsReward: 150,
      },
      {
        code: 'workouts_50',
        title: 'Veterano dos Treinos (50 Treinos)',
        description: 'Completou 50 treinos registrados no Finex!',
        icon: 'Crown',
        category: 'MILESTONE' as const,
        pointsReward: 400,
      },
      {
        code: 'points_collector',
        title: 'Colecionador de Finex Points',
        description: 'Acumulou mais de 500 pontos no clube de recompensas.',
        icon: 'Sparkles',
        category: 'COMMUNITY' as const,
        pointsReward: 100,
      },
    ];

    for (const b of defaultBadges) {
      const exists = await this.badgeRepo.findOne({ where: { code: b.code } });
      if (!exists) {
        await this.badgeRepo.save(this.badgeRepo.create(b));
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
    const gamification = await this.getOrCreateGamification(userId);
    const userBadges = await this.userBadgeRepo.find({
      where: { userId },
      relations: ['badge'],
      order: { unlockedAt: 'DESC' },
    });
    const allBadges = await this.badgeRepo.find({ order: { pointsReward: 'ASC' } });
    const recentTransactions = await this.pointTxRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const unlockedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));
    const badgesWithStatus = allBadges.map((badge) => ({
      ...badge,
      isUnlocked: unlockedBadgeIds.has(badge.id),
      unlockedAt: userBadges.find((ub) => ub.badgeId === badge.id)?.unlockedAt || null,
    }));

    return {
      gamification,
      badges: badgesWithStatus,
      recentTransactions,
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
    dto: { type: 'WALLET_CASH' | 'DAY_PASS'; pointsAmount: number },
  ) {
    const gamification = await this.getOrCreateGamification(userId);
    const amount = Number(dto.pointsAmount);

    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Quantidade de pontos inválida.');
    }

    if (gamification.pointsBalance < amount) {
      throw new BadRequestException(
        `Saldo insuficiente de pontos. Você possui ${gamification.pointsBalance} Finex Points.`,
      );
    }

    if (dto.type === 'WALLET_CASH') {
      // 100 pontos = R$ 1,00
      if (amount < 100) {
        throw new BadRequestException('O resgate mínimo para saldo na carteira é de 100 pontos (R$ 1,00).');
      }

      const cashValue = Number((amount / 100).toFixed(2));
      gamification.pointsBalance -= amount;
      await this.gamificationRepo.save(gamification);

      await this.pointTxRepo.save(
        this.pointTxRepo.create({
          userId,
          amount: -amount,
          type: 'REDEEMED_WALLET',
          description: `Conversão de ${amount} Finex Points em R$ ${cashValue.toFixed(2)} de saldo`,
        }),
      );

      // Credita na carteira Finex
      await this.walletService.creditDeposit(userId, cashValue, `Resgate de ${amount} Finex Points`);

      return {
        success: true,
        message: `Parabéns! R$ ${cashValue.toFixed(2)} foram adicionados à sua carteira Finex.`,
        newPointsBalance: gamification.pointsBalance,
        cashValue,
      };
    } else if (dto.type === 'DAY_PASS') {
      // 300 pontos = 1 Day Pass cortesia
      const DAYPASS_COST = 300;
      if (amount < DAYPASS_COST) {
        throw new BadRequestException(`Um Day Pass cortesia requer ${DAYPASS_COST} pontos.`);
      }

      gamification.pointsBalance -= DAYPASS_COST;
      await this.gamificationRepo.save(gamification);

      await this.pointTxRepo.save(
        this.pointTxRepo.create({
          userId,
          amount: -DAYPASS_COST,
          type: 'REDEEMED_DAYPASS',
          description: 'Resgate de Day Pass Cortesia Finex',
        }),
      );

      return {
        success: true,
        message: 'Day Pass Cortesia resgatado com sucesso! Utilize na catraca de qualquer parceiro.',
        newPointsBalance: gamification.pointsBalance,
      };
    }

    throw new BadRequestException('Tipo de recompensa inválido.');
  }
}
