import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { AttendanceType, LocationType, ProviderType, ServiceType } from '../entities/service.entity';

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

  @IsOptional()
  @IsString()
  recurrence?: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  benefits?: string[];

  @IsOptional()
  @IsNumber()
  maxStudents?: number;

  @IsOptional()
  @IsNumber()
  maxInstallments?: number;

  @IsOptional()
  @IsNumber()
  durationMonths?: number;

  @IsOptional()
  @IsEnum(AttendanceType)
  attendanceType?: AttendanceType;

  @IsOptional()
  @IsEnum(LocationType)
  locationType?: LocationType;

  @IsOptional()
  @IsUUID()
  partnerGymId?: string;

  @IsOptional()
  @IsString()
  locationName?: string;

  @IsOptional()
  @IsString()
  locationAddress?: string;

  @IsOptional()
  @IsString()
  locationCity?: string;

  @IsOptional()
  @IsString()
  locationState?: string;

  @IsOptional()
  @IsString()
  locationPlaceId?: string;

  @IsOptional()
  @IsString()
  onlineInstructions?: string;
}