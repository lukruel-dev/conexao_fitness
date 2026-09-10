import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkoutRoutine } from './entities/workout-routine.entity';
import { WorkoutExercise } from './entities/workout-exercise.entity';
import { WorkoutSessionLog } from './entities/workout-session-log.entity';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class WorkoutsService {
  constructor(
    @InjectRepository(WorkoutRoutine)
    private readonly routineRepo: Repository<WorkoutRoutine>,
    @InjectRepository(WorkoutExercise)
    private readonly exerciseRepo: Repository<WorkoutExercise>,
    @InjectRepository(WorkoutSessionLog)
    private readonly sessionLogRepo: Repository<WorkoutSessionLog>,
    private readonly gamificationService: GamificationService,
  ) {}

  async getMyRoutines(studentId: string): Promise<WorkoutRoutine[]> {
    let routines = await this.routineRepo.find({
      where: { studentId, isActive: true },
      relations: ['exercises'],
      order: { createdAt: 'ASC' },
    });

    // Se o aluno ainda não tem fichas, gera automaticamente a estrutura padrão ABC
    if (routines.length === 0) {
      routines = await this.seedDefaultRoutines(studentId);
    }

    return routines;
  }

  private async seedDefaultRoutines(studentId: string): Promise<WorkoutRoutine[]> {
    const templateA = this.routineRepo.create({
      studentId,
      title: 'Treino A - Peito, Tríceps & Ombros',
      description: 'Foco em hipertrofia e força para cadeia anterior superior.',
      dayOfWeek: 'Segunda-feira / Quinta-feira',
      targetMuscleGroups: ['Peito', 'Tríceps', 'Ombros'],
      exercises: [
        this.exerciseRepo.create({
          name: 'Supino Reto com Barra',
          muscleGroup: 'Peitoral',
          sets: 4,
          reps: '8-12',
          targetWeightKg: 40,
          restSeconds: 60,
          order: 1,
          notes: 'Manter escápulas retraídas e descida controlada.',
        }),
        this.exerciseRepo.create({
          name: 'Supino Inclinado com Halteres',
          muscleGroup: 'Peitoral Superior',
          sets: 3,
          reps: '10-12',
          targetWeightKg: 20,
          restSeconds: 60,
          order: 2,
        }),
        this.exerciseRepo.create({
          name: 'Crucifixo na Máquina / Peck Deck',
          muscleGroup: 'Peitoral',
          sets: 3,
          reps: '12-15',
          targetWeightKg: 35,
          restSeconds: 45,
          order: 3,
        }),
        this.exerciseRepo.create({
          name: 'Desenvolvimento com Halteres',
          muscleGroup: 'Ombros',
          sets: 3,
          reps: '10-12',
          targetWeightKg: 14,
          restSeconds: 60,
          order: 4,
        }),
        this.exerciseRepo.create({
          name: 'Elevação Lateral',
          muscleGroup: 'Ombros',
          sets: 4,
          reps: '12-15',
          targetWeightKg: 8,
          restSeconds: 45,
          order: 5,
        }),
        this.exerciseRepo.create({
          name: 'Tríceps Corda na Polia',
          muscleGroup: 'Tríceps',
          sets: 4,
          reps: '12-15',
          targetWeightKg: 25,
          restSeconds: 45,
          order: 6,
        }),
      ],
    });

    const templateB = this.routineRepo.create({
      studentId,
      title: 'Treino B - Costas, Bíceps & Abdômen',
      description: 'Foco em puxadas, espessura dorsal e flexores de cotovelo.',
      dayOfWeek: 'Terça-feira / Sexta-feira',
      targetMuscleGroups: ['Costas', 'Bíceps', 'Abdômen'],
      exercises: [
        this.exerciseRepo.create({
          name: 'Puxada Frontal na Polia',
          muscleGroup: 'Dorsal',
          sets: 4,
          reps: '10-12',
          targetWeightKg: 45,
          restSeconds: 60,
          order: 1,
        }),
        this.exerciseRepo.create({
          name: 'Remada Curvada com Barra',
          muscleGroup: 'Costas',
          sets: 4,
          reps: '8-10',
          targetWeightKg: 35,
          restSeconds: 60,
          order: 2,
        }),
        this.exerciseRepo.create({
          name: 'Remada Baixa Triângulo',
          muscleGroup: 'Costas',
          sets: 3,
          reps: '12',
          targetWeightKg: 40,
          restSeconds: 45,
          order: 3,
        }),
        this.exerciseRepo.create({
          name: 'Rosca Direta com Barra W',
          muscleGroup: 'Bíceps',
          sets: 3,
          reps: '10-12',
          targetWeightKg: 15,
          restSeconds: 60,
          order: 4,
        }),
        this.exerciseRepo.create({
          name: 'Rosca Martelo com Halteres',
          muscleGroup: 'Bíceps & Antebraço',
          sets: 3,
          reps: '12',
          targetWeightKg: 12,
          restSeconds: 45,
          order: 5,
        }),
        this.exerciseRepo.create({
          name: 'Prancha Abdominal',
          muscleGroup: 'Core',
          sets: 3,
          reps: '45s',
          targetWeightKg: 0,
          restSeconds: 45,
          order: 6,
        }),
      ],
    });

    const templateC = this.routineRepo.create({
      studentId,
      title: 'Treino C - Pernas Completas & Glúteos',
      description: 'Membros inferiores completos com ênfase em quadríceps e posteriores.',
      dayOfWeek: 'Quarta-feira / Sábado',
      targetMuscleGroups: ['Pernas', 'Glúteos', 'Panturrilhas'],
      exercises: [
        this.exerciseRepo.create({
          name: 'Agachamento Livre com Barra',
          muscleGroup: 'Quadríceps & Glúteos',
          sets: 4,
          reps: '8-10',
          targetWeightKg: 50,
          restSeconds: 90,
          order: 1,
        }),
        this.exerciseRepo.create({
          name: 'Leg Press 45º',
          muscleGroup: 'Quadríceps',
          sets: 4,
          reps: '10-12',
          targetWeightKg: 120,
          restSeconds: 60,
          order: 2,
        }),
        this.exerciseRepo.create({
          name: 'Cadeira Extensora',
          muscleGroup: 'Quadríceps',
          sets: 3,
          reps: '12-15',
          targetWeightKg: 45,
          restSeconds: 45,
          order: 3,
        }),
        this.exerciseRepo.create({
          name: 'Mesa Flexora',
          muscleGroup: 'Isquiotibiais',
          sets: 4,
          reps: '10-12',
          targetWeightKg: 35,
          restSeconds: 60,
          order: 4,
        }),
        this.exerciseRepo.create({
          name: 'Elevação Pélvica',
          muscleGroup: 'Glúteos',
          sets: 3,
          reps: '12',
          targetWeightKg: 40,
          restSeconds: 60,
          order: 5,
        }),
        this.exerciseRepo.create({
          name: 'Gêmeos Sentado (Panturrilhas)',
          muscleGroup: 'Panturrilhas',
          sets: 4,
          reps: '15-20',
          targetWeightKg: 30,
          restSeconds: 45,
          order: 6,
        }),
      ],
    });

    const savedA = await this.routineRepo.save(templateA);
    const savedB = await this.routineRepo.save(templateB);
    const savedC = await this.routineRepo.save(templateC);

    return [savedA, savedB, savedC];
  }

  async createRoutine(
    creatorId: string,
    studentId: string,
    dto: {
      title: string;
      description?: string;
      dayOfWeek?: string;
      targetMuscleGroups?: string[];
      exercises: any[];
    },
  ) {
    if (!dto.title) {
      throw new BadRequestException('O título da ficha de treino é obrigatório.');
    }

    const routine = this.routineRepo.create({
      studentId: studentId || creatorId,
      creatorId,
      title: dto.title,
      description: dto.description,
      dayOfWeek: dto.dayOfWeek,
      targetMuscleGroups: dto.targetMuscleGroups || [],
      exercises: (dto.exercises || []).map((ex, idx) =>
        this.exerciseRepo.create({
          order: idx + 1,
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          sets: Number(ex.sets) || 3,
          reps: String(ex.reps || '10-12'),
          targetWeightKg: Number(ex.targetWeightKg) || 0,
          restSeconds: Number(ex.restSeconds) || 60,
          notes: ex.notes,
          videoUrl: ex.videoUrl,
        }),
      ),
    });

    return this.routineRepo.save(routine);
  }

  async updateRoutine(
    routineId: string,
    userId: string,
    dto: {
      title?: string;
      description?: string;
      dayOfWeek?: string;
      targetMuscleGroups?: string[];
      exercises?: any[];
    },
  ) {
    const routine = await this.routineRepo.findOne({
      where: { id: routineId },
      relations: ['exercises'],
    });

    if (!routine) {
      throw new NotFoundException('Ficha de treino não encontrada.');
    }

    if (dto.title) routine.title = dto.title;
    if (dto.description !== undefined) routine.description = dto.description;
    if (dto.dayOfWeek !== undefined) routine.dayOfWeek = dto.dayOfWeek;
    if (dto.targetMuscleGroups) routine.targetMuscleGroups = dto.targetMuscleGroups;

    if (dto.exercises && Array.isArray(dto.exercises)) {
      // Remove exercícios antigos
      await this.exerciseRepo.delete({ routineId: routine.id });

      // Cria novos
      routine.exercises = dto.exercises.map((ex, idx) =>
        this.exerciseRepo.create({
          routineId: routine.id,
          order: idx + 1,
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          sets: Number(ex.sets) || 3,
          reps: String(ex.reps || '10-12'),
          targetWeightKg: Number(ex.targetWeightKg) || 0,
          restSeconds: Number(ex.restSeconds) || 60,
          notes: ex.notes,
          videoUrl: ex.videoUrl,
        }),
      );
    }

    return this.routineRepo.save(routine);
  }

  async deleteRoutine(routineId: string, userId: string) {
    const routine = await this.routineRepo.findOne({ where: { id: routineId } });
    if (!routine) {
      throw new NotFoundException('Ficha de treino não encontrada.');
    }
    routine.isActive = false;
    await this.routineRepo.save(routine);
    return { success: true, message: 'Ficha de treino removida com sucesso.' };
  }

  async completeWorkoutSession(
    studentId: string,
    dto: {
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
    const log = this.sessionLogRepo.create({
      studentId,
      routineId: dto.routineId,
      routineTitle: dto.routineTitle || 'Treino Livre',
      startedAt: new Date(dto.startedAt || Date.now() - 3600000),
      finishedAt: new Date(dto.finishedAt || Date.now()),
      durationSeconds: Number(dto.durationSeconds) || 3600,
      completedExercisesCount: Number(dto.completedExercisesCount) || 0,
      totalWeightLiftedKg: Number(dto.totalWeightLiftedKg) || 0,
      notes: dto.notes,
    });

    const savedLog = await this.sessionLogRepo.save(log);

    // Integração automática com a Gamificação: Incrementa streak e concede +50 Finex Points!
    const gamificationResult = await this.gamificationService.recordActivity(
      studentId,
      'WORKOUT',
      `Treino finalizado: ${log.routineTitle}`,
    );

    return {
      success: true,
      log: savedLog,
      gamification: gamificationResult,
    };
  }

  async getWorkoutHistory(studentId: string): Promise<WorkoutSessionLog[]> {
    return this.sessionLogRepo.find({
      where: { studentId },
      order: { finishedAt: 'DESC' },
      take: 50,
    });
  }
}
