import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnrollmentPaymentMethod } from '../entities/gym-enrollment.entity';

export class EnrollOnlineDto {
  @ApiProperty({ description: 'ID do plano de matrícula selecionado' })
  @IsUUID()
  @IsNotEmpty()
  planId: string;

  @ApiPropertyOptional({
    description: 'Método de pagamento para a matrícula',
    enum: EnrollmentPaymentMethod,
    default: EnrollmentPaymentMethod.STRIPE,
  })
  @IsEnum(EnrollmentPaymentMethod)
  @IsOptional()
  paymentMethod?: EnrollmentPaymentMethod;
}
