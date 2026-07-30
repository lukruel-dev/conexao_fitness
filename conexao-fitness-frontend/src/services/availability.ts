import { apiRequest } from "@/lib/apiClient";

export interface AvailabilityBlock {
  dayOfWeek: number; // 0=Domingo ... 6=Sábado
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

export interface AvailabilityResponse {
  availabilities: AvailabilityBlock[];
}

export async function getAvailability(): Promise<AvailabilityResponse> {
  return apiRequest<AvailabilityResponse>("/availability");
}

export async function saveAvailability(
  availabilities: AvailabilityBlock[],
): Promise<AvailabilityResponse> {
  return apiRequest<AvailabilityResponse>("/availability", {
    method: "PUT",
    body: { availabilities },
  });
}

export async function generateSlots(
  serviceId: string,
  daysAhead?: number,
): Promise<{ createdCount: number }> {
  return apiRequest<{ createdCount: number }>(
    `/services/${serviceId}/generate-slots`,
    {
      method: "POST",
      body: daysAhead !== undefined ? { daysAhead } : undefined,
    },
  );
}
