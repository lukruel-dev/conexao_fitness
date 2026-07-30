import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Booking } from './entities/booking.entity';
import { Service } from '../services/entities/service.entity';
import { ScheduleSlot } from '../services/entities/schedule-slot.entity';
import { User } from '../users/entities/user.entity';

import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WalletModule } from '../wallet/wallet.module';
import { BookingsCron } from './bookings.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Service, ScheduleSlot, User]),
    forwardRef(() => PaymentsModule),
    NotificationsModule,
    WalletModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsCron],
  exports: [BookingsService],
})
export class BookingsModule {}
