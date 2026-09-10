import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestWithdrawalDto {
  @ApiProperty({ description: 'Valor a ser sacado em R$', example: 50.0 })
  @IsNumber()
  @Min(5, { message: 'O valor mínimo para saque é de R$ 5,00.' })
  amount: number;

  @ApiProperty({
    description: 'Tipo de chave PIX',
    enum: ['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM'],
    example: 'CPF',
  })
  @IsIn(['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM'], {
    message: 'Tipo de chave PIX inválido.',
  })
  pixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';

  @ApiProperty({ description: 'Chave PIX de destino', example: '123.456.789-00' })
  @IsString()
  @IsNotEmpty({ message: 'A chave PIX é obrigatória.' })
  pixKey: string;

  @ApiPropertyOptional({ description: 'Nome do titular da conta' })
  @IsString()
  @IsOptional()
  holderName?: string;

  @ApiPropertyOptional({ description: 'Nome do banco / instituição' })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Salvar esta chave como padrão para saques futuros' })
  @IsOptional()
  saveAsDefault?: boolean;
}
