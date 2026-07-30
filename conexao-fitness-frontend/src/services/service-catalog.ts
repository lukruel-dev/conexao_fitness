import { apiRequest } from "@/lib/apiClient";
import type { ServiceType } from "@/types/api";

export interface ServiceCatalog {
  id: string;
  name: string;
  modality: string;
  durationMinutes: number;
  type: ServiceType;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateServiceCatalogDto {
  name: string;
  modality: string;
  durationMinutes?: number;
  type?: ServiceType;
  description?: string;
}

export async function listServiceCatalog(all?: boolean): Promise<ServiceCatalog[]> {
  return apiRequest<ServiceCatalog[]>("/service-catalog", { query: all ? { all: 'true' } : undefined });
}

export async function createServiceCatalog(dto: CreateServiceCatalogDto): Promise<ServiceCatalog> {
  return apiRequest<ServiceCatalog>("/service-catalog", { method: "POST", body: dto });
}

export async function updateServiceCatalog(id: string, dto: Partial<CreateServiceCatalogDto>): Promise<ServiceCatalog> {
  return apiRequest<ServiceCatalog>(`/service-catalog/${id}`, { method: "PATCH", body: dto });
}

export async function removeServiceCatalog(id: string): Promise<void> {
  return apiRequest<void>(`/service-catalog/${id}`, { method: "DELETE" });
}
