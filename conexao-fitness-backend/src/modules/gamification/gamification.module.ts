import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserGamification } from './entities/user-gamification.entity';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { PointTransaction } from './entities/point-transaction.entity';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserGamification,
      Badge,
      UserBadge,
      PointTransaction,
    ]),
    WalletModule,
  ],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
