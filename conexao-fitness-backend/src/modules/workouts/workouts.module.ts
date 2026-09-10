import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutRoutine } from './entities/workout-routine.entity';
import { WorkoutExercise } from './entities/workout-exercise.entity';
import { WorkoutSessionLog } from './entities/workout-session-log.entity';
import { WorkoutsService } from './workouts.service';
import { WorkoutsController } from './workouts.controller';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkoutRoutine,
      WorkoutExercise,
      WorkoutSessionLog,
    ]),
    GamificationModule,
  ],
  controllers: [WorkoutsController],
  providers: [WorkoutsService],
  exports: [WorkoutsService],
})
export class WorkoutsModule {}
