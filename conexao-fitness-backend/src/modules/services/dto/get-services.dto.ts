import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ProviderType } from './../entities/service.entity';

export class GetServicesDto {
  @ApiPropertyOptional({ description: 'Busca textual em nome, descrição e modalidade' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filtrar por modalidade (ex: Musculação)' })
  @IsOptional()
  @IsString()
  modality?: string;

  @ApiPropertyOptional({ enum: ProviderType, description: 'Filtrar por PERSONAL ou ACADEMIA' })
  @IsOptional()
  @IsEnum(ProviderType)
  providerType?: ProviderType;

  @ApiPropertyOptional({ description: 'Latitude do usuário para ordenação por distância' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude do usuário para ordenação por distância' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ description: 'Raio de busca em km (aplicável apenas se lat e lng forem enviados)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radiusKm?: number;
}
