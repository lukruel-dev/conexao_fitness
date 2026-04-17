import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from './modules/users/users.module';
import { User } from './modules/users/entities/user.entity';
import { AlunoProfile } from './modules/users/entities/aluno-profile.entity';
import { PersonalProfile } from './modules/users/entities/personal-profile.entity';
import { AcademiaProfile } from './modules/users/entities/academia-profile.entity';
import { AcademiaUnit } from './modules/users/entities/academia-unit.entity';

import { ServicesModule } from './modules/services/services.module';
import { Service } from './modules/services/entities/service.entity';
import { ScheduleSlot } from './modules/services/entities/schedule-slot.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '*Lu082010*',
      database: 'conexao_fitness',
      entities: [
        User,
        AlunoProfile,
        PersonalProfile,
        AcademiaProfile,
        AcademiaUnit,
        Service,
        ScheduleSlot,
      ],
      synchronize: true,
      logging: true,
    }),
    UsersModule,
    ServicesModule,
  ],
})
export class AppModule {}
