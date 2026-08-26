import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ProviderType, ServiceType } from '../entities/service.entity';

export class UpdateServiceDto {
  @IsOptional()
  @IsEnum(ProviderType)
  providerType?: ProviderType;

  @IsOptional()
  @IsUUID()
  providerId?: string;

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

  @IsOptional()
  @IsString()
  modality?: string;

  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @IsOptional()
  @IsEnum(ServiceType)
  type?: ServiceType;

  @IsOptional()
  @IsString()
  price?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}