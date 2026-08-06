import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfessionsService } from './professions.service';
import { ProfessionsController } from './professions.controller';
import { Profession } from './entities/profession.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Profession])],
  controllers: [ProfessionsController],
  providers: [ProfessionsService],
  exports: [ProfessionsService],
})
export class ProfessionsModule {}
