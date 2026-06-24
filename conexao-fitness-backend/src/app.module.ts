import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { UploadModule } from './modules/upload/upload.module';
import { AdminModule } from './modules/admin/admin.module';
import { SearchModule } from './modules/search/search.module';
import { User } from './modules/users/entities/user.entity';
import { ConfigModule } from '@nestjs/config';
import { AlunoProfile } from './modules/users/entities/aluno-profile.entity';
import { PersonalProfile } from './modules/users/entities/personal-profile.entity';
import { AcademiaProfile } from './modules/users/entities/academia-profile.entity';
import { AcademiaUnit } from './modules/users/entities/academia-unit.entity';

import { ServicesModule } from './modules/services/services.module';
import { Service } from './modules/services/entities/service.entity';
import { ScheduleSlot } from './modules/services/entities/schedule-slot.entity';

import { BookingsModule } from './modules/bookings/bookings.module';
import { Booking } from './modules/bookings/entities/booking.entity';
import { Subscription } from './modules/payments/entities/subscription.entity';

import { BookingsCancelledAtAndIndexes1713380000000 } from './database/migrations/1713380000000-BookingsCancelledAtAndIndexes';

const isDev = process.env.NODE_ENV !== 'production';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASS,
      database: process.env.DB_NAME ?? 'conexao_fitness',
      entities: [
        User,
        AlunoProfile,
        PersonalProfile,
        AcademiaProfile,
        AcademiaUnit,
        Service,
        ScheduleSlot,
        Booking,
        Subscription,
      ],
      synchronize: isDev,
      migrationsRun: !isDev,
      migrations: [BookingsCancelledAtAndIndexes1713380000000],
      logging: isDev ? ['query', 'error'] : ['error'],
    }),
    UsersModule,
    ServicesModule,
    BookingsModule,
    AuthModule,
    PaymentsModule,
    UploadModule,
    AdminModule,
    SearchModule,
  ],
})
export class AppModule {}