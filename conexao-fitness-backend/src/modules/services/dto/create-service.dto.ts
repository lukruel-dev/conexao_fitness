import { ProviderType, ServiceType } from '../entities/service.entity';

export class CreateServiceDto {
  providerType: ProviderType;
  providerId: string;
  unitId?: string | null;
  catalogId?: string;
  name?: string;
  description?: string | null;
  modality: string;
  durationMinutes: number;
  type: ServiceType;
  price: string;
  currency?: string;
  isActive?: boolean;
}