import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EnrollmentStatus } from '../entities/gym-enrollment.entity';

export class FilterEnrollmentsDto {
  @ApiPropertyOptional({
    description: 'Filtrar por status da matrícula',
    enum: EnrollmentStatus,
  })
  @IsEnum(EnrollmentStatus)
  @IsOptional()
  status?: EnrollmentStatus;

  @ApiPropertyOptional({ description: 'Busca textual por nome, email, CPF ou código QR' })
  @IsString()
  @IsOptional()
  search?: string;
}
