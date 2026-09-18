import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../users/entities/user.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Service } from '../services/entities/service.entity';
import { Subscription } from '../payments/entities/subscription.entity';
import { PersonalProfile } from '../users/entities/personal-profile.entity';
import { AlunoProfile } from '../users/entities/aluno-profile.entity';
import { AcademiaProfile } from '../users/entities/academia-profile.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Booking,
      Service,
      Subscription,
      PersonalProfile,
      AlunoProfile,
      AcademiaProfile,
    ]),
    AuthModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
