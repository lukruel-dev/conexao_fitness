import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PlanRecurrence } from '../entities/membership-plan.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMembershipPlanDto {
  @ApiProperty({ description: 'Nome do plano de matrícula', example: 'Plano Mensal Livre' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição dos detalhes e regras do plano' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Preço do plano em R$', example: 119.90 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Duração em dias (ex: 30 para mensal, 90 para trimestral, 365 para anual)', example: 30 })
  @IsNumber()
  @Min(1)
  durationDays: number;

  @ApiPropertyOptional({
    description: 'Tipo de recorrência',
    enum: PlanRecurrence,
    default: PlanRecurrence.MONTHLY,
  })
  @IsEnum(PlanRecurrence)
  @IsOptional()
  recurrence?: PlanRecurrence;

  @ApiPropertyOptional({ description: 'Modalidades inclusas no plano', example: ['Musculação', 'Cardio'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  modalities?: string[];

  @ApiPropertyOptional({ description: 'Benefícios inclusos', example: ['Acesso livre todos os dias', 'Avaliação física inicial'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  benefits?: string[];

  @ApiPropertyOptional({ description: 'Se o plano está ativo para novas matrículas', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
