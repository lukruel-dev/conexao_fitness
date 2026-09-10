import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WorkoutsService } from './workouts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Fichas de Treino & Histórico')
@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('routines')
  async getMyRoutines(
    @CurrentUser() user: any,
    @Query('studentId') studentId?: string,
  ) {
    const targetStudentId = studentId || user.id;
    return this.workoutsService.getMyRoutines(targetStudentId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('routines')
  async createRoutine(
    @CurrentUser() user: any,
    @Body()
    body: {
      studentId?: string;
      title: string;
      description?: string;
      dayOfWeek?: string;
      targetMuscleGroups?: string[];
      exercises: any[];
    },
  ) {
    return this.workoutsService.createRoutine(
      user.id,
      body.studentId || user.id,
      body,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('routines/:id')
  async updateRoutine(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.workoutsService.updateRoutine(id, user.id, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('routines/:id')
  async deleteRoutine(@CurrentUser() user: any, @Param('id') id: string) {
    return this.workoutsService.deleteRoutine(id, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('session/complete')
  async completeSession(
    @CurrentUser() user: any,
    @Body()
    body: {
      routineId?: string;
      routineTitle: string;
      startedAt: string;
      finishedAt: string;
      durationSeconds: number;
      completedExercisesCount: number;
      totalWeightLiftedKg: number;
      notes?: string;
    },
  ) {
    return this.workoutsService.completeWorkoutSession(user.id, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getHistory(
    @CurrentUser() user: any,
    @Query('studentId') studentId?: string,
  ) {
    const targetStudentId = studentId || user.id;
    return this.workoutsService.getWorkoutHistory(targetStudentId);
  }
}
