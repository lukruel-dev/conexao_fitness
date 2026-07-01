import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { AlunoProfile } from './entities/aluno-profile.entity';
import { PersonalProfile } from './entities/personal-profile.entity';
import { AcademiaProfile } from './entities/academia-profile.entity';
import { AcademiaUnit } from './entities/academia-unit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      AlunoProfile,
      PersonalProfile,
      AcademiaProfile,
      AcademiaUnit,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
