import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipPlan } from './entities/membership-plan.entity';
import { GymEnrollment } from './entities/gym-enrollment.entity';
import { GymAccessLog } from './entities/gym-access-log.entity';
import { User } from '../users/entities/user.entity';
import { Subscription } from '../payments/entities/subscription.entity';
import { Service } from '../services/entities/service.entity';
import { MembershipsService } from './memberships.service';
import { MembershipsController } from './memberships.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MembershipPlan,
      GymEnrollment,
      GymAccessLog,
      User,
      Subscription,
      Service,
    ]),
    NotificationsModule,
    WalletModule,
  ],
  controllers: [MembershipsController],
  providers: [MembershipsService],
  exports: [MembershipsService],
})
export class MembershipsModule {}
