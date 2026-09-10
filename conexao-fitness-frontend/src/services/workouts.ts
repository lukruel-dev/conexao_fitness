import { apiRequest } from '@/lib/apiClient';
import type { WorkoutRoutine, WorkoutSessionLog } from '@/types/workouts';

export async function fetchMyRoutines(studentId?: string): Promise<WorkoutRoutine[]> {
  const query = studentId ? `?studentId=${studentId}` : '';
  return apiRequest<WorkoutRoutine[]>(`/workouts/routines${query}`);
}

export async function createRoutine(data: {
  studentId?: string;
  title: string;
  description?: string;
  dayOfWeek?: string;
  targetMuscleGroups?: string[];
  exercises: any[];
}): Promise<WorkoutRoutine> {
  return apiRequest<WorkoutRoutine>('/workouts/routines', {
    method: 'POST',
    body: data,
  });
}

export async function updateRoutine(
  id: string,
  data: Partial<WorkoutRoutine>,
): Promise<WorkoutRoutine> {
  return apiRequest<WorkoutRoutine>(`/workouts/routines/${id}`, {
    method: 'PUT',
    body: data,
  });
}

export async function deleteRoutine(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/workouts/routines/${id}`, {
    method: 'DELETE',
  });
}

export async function completeWorkoutSession(data: {
  routineId?: string;
  routineTitle: string;
  startedAt: string;
  finishedAt: string;
  durationSeconds: number;
  completedExercisesCount: number;
  totalWeightLiftedKg: number;
  notes?: string;
}) {
  return apiRequest<{
    success: boolean;
    log: WorkoutSessionLog;
    gamification: any;
  }>('/workouts/session/complete', {
    method: 'POST',
    body: data,
  });
}

export async function fetchWorkoutHistory(studentId?: string): Promise<WorkoutSessionLog[]> {
  const query = studentId ? `?studentId=${studentId}` : '';
  return apiRequest<WorkoutSessionLog[]>(`/workouts/history${query}`);
}
