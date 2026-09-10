import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnrollmentPaymentMethod } from '../entities/gym-enrollment.entity';

export class ManualEnrollmentDto {
  @ApiPropertyOptional({ description: 'ID do aluno se já cadastrado no Conexão Fitness' })
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiProperty({ description: 'Nome do aluno para a matrícula' })
  @IsString()
  @IsNotEmpty()
  studentName: string;

  @ApiProperty({ description: 'Email do aluno' })
  @IsString()
  @IsNotEmpty()
  studentEmail: string;

  @ApiPropertyOptional({ description: 'CPF do aluno' })
  @IsString()
  @IsOptional()
  studentCpf?: string;

  @ApiPropertyOptional({ description: 'Foto do aluno capturada na câmera ou enviada por arquivo' })
  @IsString()
  @IsOptional()
  studentPhotoUrl?: string;

  @ApiPropertyOptional({ description: 'ID do plano da academia (se houver)' })
  @IsString()
  @IsOptional()
  planId?: string;

  @ApiProperty({ description: 'Nome do plano contratado', example: 'Plano Mensal Balcão' })
  @IsString()
  @IsNotEmpty()
  planName: string;

  @ApiProperty({ description: 'Valor pago pelo aluno', example: 120.0 })
  @IsNumber()
  @Min(0)
  amountPaid: number;

  @ApiProperty({ description: 'Duração da matrícula em dias', example: 30 })
  @IsNumber()
  @Min(1)
  durationDays: number;

  @ApiPropertyOptional({
    description: 'Método de pagamento recebido no balcão',
    enum: EnrollmentPaymentMethod,
    default: EnrollmentPaymentMethod.MANUAL,
  })
  @IsEnum(EnrollmentPaymentMethod)
  @IsOptional()
  paymentMethod?: EnrollmentPaymentMethod;

  @ApiPropertyOptional({ description: 'Observações internas da academia' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Enviar notificação de confirmação para o app do aluno' })
  @IsOptional()
  notifyStudent?: boolean;
}
