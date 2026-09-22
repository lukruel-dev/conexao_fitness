import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { WalletAccount } from './entities/wallet-account.entity';
import { PaymentIntent } from './entities/payment-intent.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { WalletWithdrawal } from './entities/wallet-withdrawal.entity';
import { User } from '../users/entities/user.entity';
import { GymAccessLog } from '../memberships/entities/gym-access-log.entity';
import { GymEnrollment } from '../memberships/entities/gym-enrollment.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Service } from '../services/entities/service.entity';
import { ScheduleSlot } from '../services/entities/schedule-slot.entity';
import { QRModule } from '../qr/qr.module';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WalletAccount,
      PaymentIntent,
      WalletTransaction,
      WalletWithdrawal,
      User,
      GymAccessLog,
      GymEnrollment,
      Booking,
      Service,
      ScheduleSlot,
    ]),
    QRModule,
    forwardRef(() => PaymentsModule),
    NotificationsModule,
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
