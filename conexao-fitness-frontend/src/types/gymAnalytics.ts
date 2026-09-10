export interface PeakHourData {
  hour: string;
  hourNumber: number;
  accessCount: number;
  intensityPercent: number;
  label: string;
}

export interface GymCrowdStats {
  currentLevel: 'BAIXA' | 'MODERADA' | 'ALTA';
  currentLevelLabel: string;
  currentLevelColor: 'emerald' | 'amber' | 'rose';
  currentOccupancyPercent: number;
  activeNowCount: number;
  peakHours: PeakHourData[];
  bestHours: string[];
  totalAccessesLastMonth: number;
}
