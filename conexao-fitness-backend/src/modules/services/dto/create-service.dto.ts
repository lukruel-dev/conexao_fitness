import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ProviderType, ServiceType } from '../entities/service.entity';

export class CreateServiceDto {
  @IsEnum(ProviderType)
  providerType: ProviderType;

  @IsUUID()
  providerId: string;

  @IsOptional()
  @IsUUID()
  unitId?: string | null;

  @IsOptional()
  @IsUUID()
  catalogId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsString()
  modality: string;

  @IsNumber()
  durationMinutes: number;

  @IsEnum(ServiceType)
  type: ServiceType;

  @IsString()
  price: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}