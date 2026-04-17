import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Service } from '../services/entities/service.entity';
import { ScheduleSlot } from '../services/entities/schedule-slot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Service, ScheduleSlot])],
  providers: [BookingsService],
  controllers: [BookingsController],
  exports: [BookingsService],
})
export class BookingsModule {}