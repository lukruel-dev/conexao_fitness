import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateAccessDto {
  @ApiProperty({
    description: 'Código de acesso QR lido na catraca ou CPF/Código do aluno',
    example: 'CF-ACAD-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  })
  @IsString()
  @IsNotEmpty()
  qrCode: string;

  @ApiPropertyOptional({
    description: 'Nome ou identificador da catraca/dispositivo de leitura',
    default: 'Catraca Principal',
  })
  @IsString()
  @IsOptional()
  deviceInfo?: string;
}
