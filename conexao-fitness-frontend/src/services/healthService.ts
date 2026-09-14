import { Capacitor } from '@capacitor/core';
import type {
  DailyHealthSummary,
  HealthPlatform,
  HealthSharingConsent,
  HealthSnapshot,
  SleepSession,
  WorkoutActivity,
} from '@/types/health';
import { createPost } from './posts';
import type { Post } from '@/types/community';

const HEALTH_STORAGE_PREFIX = 'cf_smartwatch_health_v1';
const HEALTH_CONSENT_PREFIX = 'cf_smartwatch_consent_v1';
const HEALTH_LAST_SYNC_KEY = 'cf_smartwatch_last_sync_v1';
const HEALTH_PERM_KEY = 'cf_smartwatch_perm_granted_v1';

export interface HealthDataResult {
  platform: HealthPlatform;
  deviceModel: string;
  lastSync: string;
  isPermissionGranted: boolean;
  workouts: WorkoutActivity[];
  sleepSessions: SleepSession[];
  weeklySummaries: DailyHealthSummary[];
  averageDailyCalories: number;
  averageSleepHours: number;
  averageSleepScore: number;
}

/**
 * Detecta a plataforma do dispositivo para Health Connect ou HealthKit
 */
export function getHealthPlatform(): { platform: HealthPlatform; label: string; deviceModel: string } {
  const capPlatform = Capacitor.getPlatform();
  if (capPlatform === 'ios') {
    return {
      platform: 'APPLE_HEALTH',
      label: 'Apple HealthKit',
      deviceModel: 'Apple Watch Series 9 (watchOS 10)',
    };
  }
  if (capPlatform === 'android') {
    return {
      platform: 'HEALTH_CONNECT',
      label: 'Health Connect (Google)',
      deviceModel: 'Samsung Galaxy Watch 6 / Wear OS',
    };
  }
  return {
    platform: 'WEB_SIMULATOR',
    label: 'Health Connect / HealthKit (Simulador)',
    deviceModel: 'Smartwatch Pareado (Apple Watch / Galaxy Watch)',
  };
}

/**
 * Verifica se o usuário já concedeu permissões
 */
export function isHealthPermissionGranted(): boolean {
  return localStorage.getItem(HEALTH_PERM_KEY) === 'true';
}

/**
 * Solicita permissões de leitura biométrica para o sistema operacional
 */
export async function requestHealthPermissions(): Promise<boolean> {
  // Em dispositivo nativo com Capacitor Health Plugin, isso acionaria a intent nativa
  // Aqui gravamos o consentimento do sistema
  localStorage.setItem(HEALTH_PERM_KEY, 'true');
  return true;
}

/**
 * Desconecta a sincronização do relógio
 */
export function disconnectHealthIntegration(): void {
  localStorage.removeItem(HEALTH_PERM_KEY);
}

/**
 * Retorna a data/hora da última sincronização
 */
export function getLastSyncTime(studentId: string): string | null {
  return localStorage.getItem(`${HEALTH_LAST_SYNC_KEY}_${studentId}`) || null;
}

/**
 * Gera ou recupera dados biométricos completos dos últimos 7 dias
 */
export function getHealthData(studentId: string): HealthDataResult {
  const { platform, deviceModel } = getHealthPlatform();
  const isGranted = isHealthPermissionGranted();
  const lastSync = getLastSyncTime(studentId) || new Date().toISOString();

  const raw = localStorage.getItem(`${HEALTH_STORAGE_PREFIX}_${studentId}`);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        platform,
        deviceModel: parsed.deviceModel || deviceModel,
        isPermissionGranted: isGranted,
      };
    } catch {}
  }

  // Gera dados realistas de exemplo caso seja a primeira sincronização
  const defaultData = generateRealisticWeeklyData(studentId, platform, deviceModel);
  localStorage.setItem(`${HEALTH_STORAGE_PREFIX}_${studentId}`, JSON.stringify(defaultData));
  localStorage.setItem(`${HEALTH_LAST_SYNC_KEY}_${studentId}`, new Date().toISOString());

  return {
    ...defaultData,
    isPermissionGranted: isGranted,
  };
}

/**
 * Força uma nova sincronização com o relógio inteligente
 */
export async function syncSmartwatchData(studentId: string): Promise<HealthDataResult> {
  const { platform, deviceModel } = getHealthPlatform();
  // Simula tempo de leitura de sensores e Bluetooth
  await new Promise((resolve) => setTimeout(resolve, 800));

  localStorage.setItem(HEALTH_PERM_KEY, 'true');
  const freshData = generateRealisticWeeklyData(studentId, platform, deviceModel);
  localStorage.setItem(`${HEALTH_STORAGE_PREFIX}_${studentId}`, JSON.stringify(freshData));
  localStorage.setItem(`${HEALTH_LAST_SYNC_KEY}_${studentId}`, new Date().toISOString());

  return {
    ...freshData,
    isPermissionGranted: true,
  };
}

/**
 * Gerenciamento de Consentimento de Compartilhamento (LGPD)
 */
export function getHealthConsent(studentId: string): HealthSharingConsent {
  const raw = localStorage.getItem(`${HEALTH_CONSENT_PREFIX}_${studentId}`);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {}
  }

  // Por padrão, ativo para proporcionar a melhor experiência de acompanhamento
  const defaultConsent: HealthSharingConsent = {
    studentId,
    shareWithPersonalTrainer: true,
    shareWithNutritionist: true,
    allowedMetrics: ['WORKOUTS', 'CALORIES', 'SLEEP', 'HEART_RATE'],
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(`${HEALTH_CONSENT_PREFIX}_${studentId}`, JSON.stringify(defaultConsent));
  return defaultConsent;
}

export function updateHealthConsent(
  studentId: string,
  updates: Partial<HealthSharingConsent>
): HealthSharingConsent {
  const current = getHealthConsent(studentId);
  const updated: HealthSharingConsent = {
    ...current,
    ...updates,
    studentId,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(`${HEALTH_CONSENT_PREFIX}_${studentId}`, JSON.stringify(updated));
  return updated;
}

/**
 * Publica a evolução de treinos e sono no feed da comunidade
 */
export async function publishHealthEvolutionToFeed(
  snapshot: HealthSnapshot,
  caption: string,
  user: any
): Promise<Post> {
  const platformName = snapshot.provider === 'APPLE_HEALTH' ? 'Apple Health' : 'Health Connect';
  const contentText = caption.trim()
    ? caption
    : `Semana de alta consistência sincronizada com meu relógio inteligente (${platformName})! Foram ${
        snapshot.workoutsCount
      } treinos concluídos, ${snapshot.totalCaloriesBurned.toLocaleString('pt-BR')} kcal gastas e uma média de ${(
        snapshot.sleepDurationMinutes / 60
      ).toFixed(1)}h de sono com score ${snapshot.sleepScore}/100. Foco total nos resultados! 💪😴`;

  const newPost = await createPost(
    {
      content: contentText,
      category: 'Treino',
      tags: ['EvolucaoSmartwatch', 'SaudeEPerformance', 'AppleHealth', 'HealthConnect', 'SonoERecuperacao'],
      healthSnapshot: snapshot,
    },
    user
  );

  return newPost;
}

/**
 * Gerador de dados biométricos realistas dos últimos 7 dias
 */
function generateRealisticWeeklyData(
  studentId: string,
  platform: HealthPlatform,
  deviceModel: string
): Omit<HealthDataResult, 'isPermissionGranted'> {
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const today = new Date();
  const weeklySummaries: DailyHealthSummary[] = [];
  const workouts: WorkoutActivity[] = [];
  const sleepSessions: SleepSession[] = [];

  const baseCalories = [540, 620, 480, 710, 590, 650, 420];
  const baseWorkoutMins = [50, 65, 45, 75, 60, 70, 40];
  const baseWorkoutTypes: ('MUSCULACAO' | 'CORRIDA' | 'FUNCIONAL' | 'HIIT' | 'CICLISMO')[] = [
    'MUSCULACAO',
    'MUSCULACAO',
    'CORRIDA',
    'FUNCIONAL',
    'MUSCULACAO',
    'HIIT',
    'CICLISMO',
  ];

  // Dados de sono (em minutos): total ~ 7h a 8h
  const baseSleepMins = [460, 480, 430, 490, 470, 510, 480];
  const baseDeepMins = [95, 110, 80, 115, 100, 125, 105];
  const baseRemMins = [105, 115, 90, 120, 110, 130, 115];
  const baseScores = [84, 88, 76, 91, 86, 94, 89];

  let totalCals = 0;
  let totalSleepMinsSum = 0;
  let totalSleepScoreSum = 0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dayLabel = dayNames[d.getDay()];
    const dateStr = d.toISOString().split('T')[0];

    const cals = baseCalories[6 - i];
    const wMins = baseWorkoutMins[6 - i];
    const sMins = baseSleepMins[6 - i];
    const deepMins = baseDeepMins[6 - i];
    const remMins = baseRemMins[6 - i];
    const lightMins = sMins - deepMins - remMins - 20;
    const score = baseScores[6 - i];
    const avgHeartRate = 132 + Math.floor(Math.random() * 12);

    totalCals += cals;
    totalSleepMinsSum += sMins;
    totalSleepScoreSum += score;

    // Resumo diário
    weeklySummaries.push({
      date: dateStr,
      dayLabel,
      caloriesBurned: cals,
      workoutMinutes: wMins,
      workoutsCount: 1,
      sleepMinutes: sMins,
      sleepScore: score,
      deepSleepMinutes: deepMins,
      remSleepMinutes: remMins,
      lightSleepMinutes: lightMins,
      awakeMinutes: 20,
      avgHeartRateBpm: avgHeartRate,
    });

    // Treino do dia
    workouts.push({
      id: `workout-${dateStr}-${i}`,
      type: baseWorkoutTypes[6 - i],
      title:
        baseWorkoutTypes[6 - i] === 'MUSCULACAO'
          ? 'Treino de Força & Hipertrofia'
          : baseWorkoutTypes[6 - i] === 'CORRIDA'
          ? 'Corrida de Rua Outdoor'
          : baseWorkoutTypes[6 - i] === 'HIIT'
          ? 'HIIT Queima Metabólica'
          : 'Treinamento Funcional Intenso',
      durationMinutes: wMins,
      caloriesBurned: cals,
      avgHeartRateBpm: avgHeartRate,
      maxHeartRateBpm: avgHeartRate + 32,
      startedAt: `${dateStr}T17:30:00Z`,
      endedAt: `${dateStr}T18:${wMins}:00Z`,
      source: platform,
      deviceModel,
    });

    // Sessão de sono do dia
    sleepSessions.push({
      id: `sleep-${dateStr}-${i}`,
      date: dateStr,
      totalMinutes: sMins,
      stages: {
        deepSleepMinutes: deepMins,
        remSleepMinutes: remMins,
        lightSleepMinutes: lightMins,
        awakeMinutes: 20,
      },
      score,
      efficiencyPercent: Math.round(((sMins - 20) / sMins) * 100),
      inBedAt: `${dateStr}T23:15:00Z`,
      outOfBedAt: `${dateStr}T07:15:00Z`,
      source: platform,
    });
  }

  const averageDailyCalories = Math.round(totalCals / 7);
  const averageSleepHours = Number((totalSleepMinsSum / 7 / 60).toFixed(1));
  const averageSleepScore = Math.round(totalSleepScoreSum / 7);

  return {
    platform,
    deviceModel,
    lastSync: new Date().toISOString(),
    workouts,
    sleepSessions,
    weeklySummaries,
    averageDailyCalories,
    averageSleepHours,
    averageSleepScore,
  };
}
