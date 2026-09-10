import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChargeDayPassDto {
  @ApiProperty({
    description: 'Identificador do aluno: QR Code universal, ID do usuário, CPF ou E-mail',
    example: 'CONEXAO_FITNESS_USER:9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  })
  @IsString()
  @IsNotEmpty()
  studentIdentifier: string;

  @ApiPropertyOptional({
    description: 'Valor customizado do Day Pass (se não informado, usa o preço cadastrado da academia ou R$ 25,00)',
    example: 30.0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  customAmount?: number;

  @ApiPropertyOptional({
    description: 'Nome ou identificador da catraca/recepção',
    default: 'Recepção Day Pass Finex',
  })
  @IsString()
  @IsOptional()
  deviceInfo?: string;
}
