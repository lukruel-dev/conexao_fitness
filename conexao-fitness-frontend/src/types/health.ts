export type HealthPlatform = 'APPLE_HEALTH' | 'HEALTH_CONNECT' | 'WEB_SIMULATOR';

export type WorkoutType = 
  | 'MUSCULACAO'
  | 'CORRIDA'
  | 'CICLISMO'
  | 'HIIT'
  | 'FUNCIONAL'
  | 'NATACAO'
  | 'CAMINHADA'
  | 'OUTRO';

export interface WorkoutActivity {
  id: string;
  type: WorkoutType;
  title: string;
  durationMinutes: number;
  caloriesBurned: number;
  avgHeartRateBpm: number;
  maxHeartRateBpm: number;
  startedAt: string;
  endedAt: string;
  source: HealthPlatform;
  deviceModel?: string;
}

export interface SleepStageBreakdown {
  deepSleepMinutes: number;
  remSleepMinutes: number;
  lightSleepMinutes: number;
  awakeMinutes: number;
}

export interface SleepSession {
  id: string;
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  stages: SleepStageBreakdown;
  score: number; // 0-100
  efficiencyPercent: number;
  inBedAt: string;
  outOfBedAt: string;
  source: HealthPlatform;
}

export interface DailyHealthSummary {
  date: string; // YYYY-MM-DD
  dayLabel: string; // Seg, Ter, Qua...
  caloriesBurned: number;
  workoutMinutes: number;
  workoutsCount: number;
  sleepMinutes: number;
  sleepScore: number;
  deepSleepMinutes: number;
  remSleepMinutes: number;
  lightSleepMinutes: number;
  awakeMinutes: number;
  avgHeartRateBpm: number;
}

export interface HealthSharingConsent {
  studentId: string;
  shareWithPersonalTrainer: boolean;
  shareWithNutritionist: boolean;
  allowedMetrics: ('WORKOUTS' | 'CALORIES' | 'SLEEP' | 'HEART_RATE')[];
  updatedAt: string;
}

export interface HealthSnapshot {
  provider: HealthPlatform;
  deviceModel?: string;
  date: string;
  periodLabel?: string;
  totalCaloriesBurned: number;
  workoutsCount: number;
  workoutDurationMinutes: number;
  sleepDurationMinutes: number;
  sleepScore: number;
  deepSleepMinutes: number;
  remSleepMinutes: number;
  avgHeartRateBpm?: number;
  summaryText?: string;
}
