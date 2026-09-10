const LOCAL_ROUTINES_KEY = 'cf_student_routines_v2';
const LOCAL_HISTORY_KEY = 'cf_workout_history_v2';

export async function fetchMyRoutines(studentId?: string): Promise<WorkoutRoutine[]> {
  try {
    const query = studentId ? `?studentId=${studentId}` : '';
    const res = await apiRequest<WorkoutRoutine[]>(`/workouts/routines${query}`);
    if (Array.isArray(res) && res.length > 0) {
      localStorage.setItem(LOCAL_ROUTINES_KEY, JSON.stringify(res));
      return res;
    }
  } catch (err) {
    console.warn('Backend routines unavailable, falling back to cached routines:', err);
  }

  const raw = localStorage.getItem(LOCAL_ROUTINES_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {}
  }

  // Ficha padrão inicial modelo (Treino Prescrito de Alta Performance)
  const defaultRoutines: WorkoutRoutine[] = [
    {
      id: 'routine-finex-coach-a',
      studentId: studentId || 'current-user',
      creatorName: 'Carlos Silva (Personal Finex)',
      creatorRole: 'PERSONAL',
      creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
      isPrescribedByPersonal: true,
      coachNotes: 'Focar na cadência lenta (3s descida, 1s subida explosiva). Beber 500ml de água durante o treino.',
      title: 'Treino A — Peitoral & Tríceps (Hipertrofia)',
      description: 'Prescrito pelo seu Personal Trainer com foco em sobrecarga progressiva e biomecânica.',
      dayOfWeek: 'Segunda / Quinta',
      targetMuscleGroups: ['Peitoral', 'Tríceps', 'Ombros'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      exercises: [
        {
          order: 1,
          name: 'Supino Reto com Barra',
          muscleGroup: 'Peitoral',
          sets: 4,
          reps: '8-10',
          targetWeightKg: 50,
          restSeconds: 90,
          notes: 'Aquecer 1 série leve antes da carga principal. Pegada firme na largura dos ombros.',
        },
        {
          order: 2,
          name: 'Supino Inclinado com Halteres',
          muscleGroup: 'Peitoral',
          sets: 3,
          reps: '10-12',
          targetWeightKg: 22,
          restSeconds: 60,
          notes: 'Banco a 30º. Manter escápulas aduzidas.',
        },
        {
          order: 3,
          name: 'Crucifixo no Cabo / Crossover',
          muscleGroup: 'Peitoral',
          sets: 3,
          reps: '12-15',
          targetWeightKg: 15,
          restSeconds: 45,
          notes: 'Pico de contração de 1s no centro.',
        },
        {
          order: 4,
          name: 'Tríceps Corda na Polia',
          muscleGroup: 'Tríceps',
          sets: 4,
          reps: '12-15',
          targetWeightKg: 25,
          restSeconds: 45,
          notes: 'Abrir a corda no final do movimento.',
        },
        {
          order: 5,
          name: 'Tríceps Francês Unilateral',
          muscleGroup: 'Tríceps',
          sets: 3,
          reps: '10-12',
          targetWeightKg: 10,
          restSeconds: 45,
        },
      ],
    },
    {
      id: 'routine-finex-coach-b',
      studentId: studentId || 'current-user',
      creatorName: 'Carlos Silva (Personal Finex)',
      creatorRole: 'PERSONAL',
      creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
      isPrescribedByPersonal: true,
      coachNotes: 'Alongar posteriores e quadríceps antes de iniciar.',
      title: 'Treino B — Dorsais, Bíceps & Abdômen',
      description: 'Prescrito com ênfase em densidade e largura de costas.',
      dayOfWeek: 'Terça / Sexta',
      targetMuscleGroups: ['Costas', 'Bíceps', 'Abdômen'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      exercises: [
        {
          order: 1,
          name: 'Puxada Frontal Aberta',
          muscleGroup: 'Costas',
          sets: 4,
          reps: '10-12',
          targetWeightKg: 45,
          restSeconds: 60,
        },
        {
          order: 2,
          name: 'Remada Curvada com Barra',
          muscleGroup: 'Costas',
          sets: 4,
          reps: '8-10',
          targetWeightKg: 40,
          restSeconds: 75,
        },
        {
          order: 3,
          name: 'Remada Baixa Triângulo',
          muscleGroup: 'Costas',
          sets: 3,
          reps: '12-15',
          targetWeightKg: 40,
          restSeconds: 60,
        },
        {
          order: 4,
          name: 'Rosca Direta com Barra W',
          muscleGroup: 'Bíceps',
          sets: 4,
          reps: '10-12',
          targetWeightKg: 20,
          restSeconds: 45,
        },
        {
          order: 5,
          name: 'Prancha Abdominal Isométrica',
          muscleGroup: 'Abdômen',
          sets: 3,
          reps: '45 seg',
          targetWeightKg: 0,
          restSeconds: 45,
        },
      ],
    },
  ];

  localStorage.setItem(LOCAL_ROUTINES_KEY, JSON.stringify(defaultRoutines));
  return defaultRoutines;
}

export async function createRoutine(data: {
  studentId?: string;
  creatorName?: string;
  creatorRole?: string;
  creatorAvatar?: string;
  isPrescribedByPersonal?: boolean;
  coachNotes?: string;
  title: string;
  description?: string;
  dayOfWeek?: string;
  targetMuscleGroups?: string[];
  exercises: any[];
}): Promise<WorkoutRoutine> {
  const newRoutine: WorkoutRoutine = {
    id: `routine-${Date.now()}`,
    studentId: data.studentId || 'current-user',
    creatorName: data.creatorName,
    creatorRole: data.creatorRole,
    creatorAvatar: data.creatorAvatar,
    isPrescribedByPersonal: data.isPrescribedByPersonal,
    coachNotes: data.coachNotes,
    title: data.title,
    description: data.description,
    dayOfWeek: data.dayOfWeek,
    targetMuscleGroups: data.targetMuscleGroups || ['Geral'],
    isActive: true,
    exercises: data.exercises,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const res = await apiRequest<WorkoutRoutine>('/workouts/routines', {
      method: 'POST',
      body: data,
    });
    if (res && res.id) return res;
  } catch (err) {
    console.warn('Backend save routine error, persisting locally:', err);
  }

  const existing = await fetchMyRoutines();
  const updated = [newRoutine, ...existing];
  localStorage.setItem(LOCAL_ROUTINES_KEY, JSON.stringify(updated));

  return newRoutine;
}

export async function updateRoutine(
  id: string,
  data: Partial<WorkoutRoutine>,
): Promise<WorkoutRoutine> {
  try {
    const res = await apiRequest<WorkoutRoutine>(`/workouts/routines/${id}`, {
      method: 'PUT',
      body: data,
    });
    if (res && res.id) return res;
  } catch (err) {
    console.warn('Backend update routine error, updating locally:', err);
  }

  const existing = await fetchMyRoutines();
  const updated = existing.map((r) => (r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r));
  localStorage.setItem(LOCAL_ROUTINES_KEY, JSON.stringify(updated));

  return updated.find((r) => r.id === id)!;
}

export async function deleteRoutine(id: string): Promise<{ success: boolean }> {
  try {
    await apiRequest<{ success: boolean }>(`/workouts/routines/${id}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('Backend delete routine error, deleting locally:', err);
  }

  const existing = await fetchMyRoutines();
  const updated = existing.filter((r) => r.id !== id);
  localStorage.setItem(LOCAL_ROUTINES_KEY, JSON.stringify(updated));

  return { success: true };
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
  const newLog: WorkoutSessionLog = {
    id: `log-${Date.now()}`,
    routineId: data.routineId,
    studentId: 'current-user',
    routineTitle: data.routineTitle,
    startedAt: data.startedAt,
    finishedAt: data.finishedAt,
    durationSeconds: data.durationSeconds,
    completedExercisesCount: data.completedExercisesCount,
    totalWeightLiftedKg: data.totalWeightLiftedKg,
    notes: data.notes,
    createdAt: new Date().toISOString(),
  };

  try {
    return await apiRequest<{
      success: boolean;
      log: WorkoutSessionLog;
      gamification: any;
    }>('/workouts/session/complete', {
      method: 'POST',
      body: data,
    });
  } catch (err) {
    console.warn('Backend complete session error, saving locally:', err);
  }

  const existingHistory = await fetchWorkoutHistory();
  const updatedHistory = [newLog, ...existingHistory];
  localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(updatedHistory));

  return {
    success: true,
    log: newLog,
    gamification: { currentStreak: 3, points: 50 },
  };
}

export async function fetchWorkoutHistory(studentId?: string): Promise<WorkoutSessionLog[]> {
  try {
    const query = studentId ? `?studentId=${studentId}` : '';
    const res = await apiRequest<WorkoutSessionLog[]>(`/workouts/history${query}`);
    if (Array.isArray(res) && res.length > 0) {
      localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(res));
      return res;
    }
  } catch (err) {
    console.warn('Backend history error, using cache:', err);
  }

  const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {}
  }

  return [];
}

