import { apiRequest } from '@/lib/apiClient';
import type { GamificationSummary } from '@/types/gamification';

export async function fetchGamificationSummary(): Promise<GamificationSummary> {
  return apiRequest<GamificationSummary>('/gamification/summary');
}

export async function recordGamificationActivity(
  type: 'CHECKIN' | 'WORKOUT' | 'ENROLLMENT',
  description?: string,
) {
  return apiRequest<{
    gamification: any;
    pointsEarned: number;
    newBadges: any[];
  }>('/gamification/activity', {
    method: 'POST',
    body: { type, description },
  });
}

export async function redeemFinexPoints(
  type: 'WALLET_CASH' | 'DAY_PASS',
  pointsAmount: number,
) {
  return apiRequest<{
    success: boolean;
    message: string;
    newPointsBalance: number;
    cashValue?: number;
  }>('/gamification/redeem', {
    method: 'POST',
    body: { type, pointsAmount },
  });
}
