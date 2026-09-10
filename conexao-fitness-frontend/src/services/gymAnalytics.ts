import { apiRequest } from '@/lib/apiClient';
import type { GymCrowdStats } from '@/types/gymAnalytics';

export async function fetchGymCrowdStats(academiaId: string): Promise<GymCrowdStats> {
  return apiRequest<GymCrowdStats>(`/memberships/gym/${academiaId}/crowd-stats`);
}

export async function fetchMyGymCrowdStats(): Promise<GymCrowdStats> {
  return apiRequest<GymCrowdStats>('/memberships/crowd-stats/my');
}
