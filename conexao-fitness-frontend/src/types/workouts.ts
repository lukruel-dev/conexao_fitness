export interface WorkoutExercise {
  id?: string;
  order: number;
  name: string;
  muscleGroup?: string;
  sets: number;
  reps: string;
  targetWeightKg: number;
  restSeconds: number;
  notes?: string;
  videoUrl?: string;
  isCompleted?: boolean;
  actualWeightKg?: number;
}

export interface WorkoutRoutine {
  id: string;
  studentId: string;
  creatorId?: string;
  creatorName?: string;
  creatorRole?: string;
  creatorAvatar?: string;
  isPrescribedByPersonal?: boolean;
  coachNotes?: string;
  title: string;
  description?: string;
  dayOfWeek?: string;
  targetMuscleGroups: string[];
  isActive: boolean;
  exercises: WorkoutExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSessionLog {
  id: string;
  routineId?: string;
  studentId: string;
  routineTitle: string;
  startedAt: string;
  finishedAt: string;
  durationSeconds: number;
  completedExercisesCount: number;
  totalWeightLiftedKg: number;
  notes?: string;
  createdAt: string;
}
