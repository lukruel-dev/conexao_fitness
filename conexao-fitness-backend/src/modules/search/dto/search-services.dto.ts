import { IsNumber, IsOptional, IsString, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchServicesDto {
  @IsNumber()
  @Type(() => Number)
  lat: number;

  @IsNumber()
  @Type(() => Number)
  lng: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  radiusKm?: number;

  @IsOptional()
  @IsString()
  modality?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  @IsIn(['PERSONAL', 'ACADEMIA'])
  providerType?: 'PERSONAL' | 'ACADEMIA';

  @IsOptional()
  @IsString()
  targetCity?: string; // Caso o usuário queira buscar por nome da cidade ao invés do GPS
}
