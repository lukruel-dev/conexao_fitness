import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EnrollmentPaymentMethod } from '../entities/gym-enrollment.entity';

export class RenewEnrollmentDto {
  @ApiPropertyOptional({ description: 'Duração adicional em dias (padrão 30)', example: 30 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  additionalDays?: number;

  @ApiPropertyOptional({ description: 'Valor cobrado na renovação', example: 120.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amountPaid?: number;

  @ApiPropertyOptional({
    description: 'Método de pagamento da renovação',
    enum: EnrollmentPaymentMethod,
    default: EnrollmentPaymentMethod.MANUAL,
  })
  @IsEnum(EnrollmentPaymentMethod)
  @IsOptional()
  paymentMethod?: EnrollmentPaymentMethod;
}
