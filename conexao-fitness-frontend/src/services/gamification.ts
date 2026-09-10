import { apiRequest } from '@/lib/apiClient';
import type {
  GamificationSummary,
  RedeemRewardDto,
  RedeemRewardResponse,
} from '@/types/gamification';

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
  dto: RedeemRewardDto,
): Promise<RedeemRewardResponse> {
  return apiRequest<RedeemRewardResponse>('/gamification/redeem', {
    method: 'POST',
    body: dto,
  });
}
