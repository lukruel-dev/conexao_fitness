import { apiRequest } from "@/lib/apiClient";
import type { Service } from "@/types/api";

export interface ListServicesFilters {
  q?: string;
  modality?: string;
  providerType?: "PERSONAL" | "ACADEMIA";
  city?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

export async function listServices(filters: ListServicesFilters = {}): Promise<Service[]> {
  return apiRequest<Service[]>("/services", { query: { ...filters } });
}

export async function getServiceById(id: string): Promise<Service> {
  return apiRequest<Service>(`/services/${id}`);
}

export async function createService(dto: any): Promise<Service> {
  return apiRequest<Service>("/services", { method: "POST", body: dto });
}

export async function updateService(id: string, dto: any): Promise<Service> {
  return apiRequest<Service>(`/services/${id}`, { method: "PATCH", body: dto });
}

export async function removeService(id: string): Promise<void> {
  return apiRequest<void>(`/services/${id}`, { method: "DELETE" });
}
