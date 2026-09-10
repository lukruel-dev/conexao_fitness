import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SavePixSettingsDto {
  @ApiProperty({
    description: 'Tipo de chave PIX',
    enum: ['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM'],
    example: 'CPF',
  })
  @IsIn(['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM'], {
    message: 'Tipo de chave PIX inválido.',
  })
  pixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';

  @ApiProperty({ description: 'Chave PIX', example: '123.456.789-00' })
  @IsString()
  @IsNotEmpty({ message: 'A chave PIX é obrigatória.' })
  pixKey: string;

  @ApiPropertyOptional({ description: 'Nome do titular da conta' })
  @IsString()
  @IsOptional()
  pixHolderName?: string;

  @ApiPropertyOptional({ description: 'Nome do banco / instituição' })
  @IsString()
  @IsOptional()
  bankName?: string;
}
