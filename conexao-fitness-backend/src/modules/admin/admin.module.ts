import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../users/entities/user.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Service } from '../services/entities/service.entity';
import { Subscription } from '../payments/entities/subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Booking, Service, Subscription])],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
