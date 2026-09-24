import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IndicateGymDto {
  @ApiProperty({ description: 'ID do Google Place ou identificador do estabelecimento' })
  @IsNotEmpty()
  @IsString()
  placeId: string;

  @ApiProperty({ description: 'Nome do estabelecimento' })
  @IsNotEmpty()
  @IsString()
  gymName: string;

  @ApiPropertyOptional({ description: 'Endereço completo' })
  @IsOptional()
  @IsString()
  gymAddress?: string;

  @ApiPropertyOptional({ description: 'Cidade' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'UF do Estado' })
  @IsOptional()
  @IsString()
  state?: string;
}
