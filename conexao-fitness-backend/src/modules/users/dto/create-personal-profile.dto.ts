import { IsString, IsOptional, IsArray, IsNumber, Min } from 'class-validator';

export class CreatePersonalProfileDto {
  @IsString()
  publicName: string;

  @IsString()
  cref: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modalities?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  serviceRadiusKm?: number;

  @IsOptional()
  @IsString()
  baseHourlyPrice?: string;

  // URL do documento de identidade/CREF upado na nuvem (AWS S3)
  @IsString()
  documentUrl: string;
}
