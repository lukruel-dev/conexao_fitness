import { apiRequest } from "@/lib/apiClient";
import type { ScheduleSlot } from "@/types/api";

export async function listSlotsByService(
  serviceId: string,
  range?: { from?: string; to?: string },
): Promise<ScheduleSlot[]> {
  return apiRequest<ScheduleSlot[]>(`/services/${serviceId}/slots`, {
    query: range as Record<string, string> | undefined,
  });
}
