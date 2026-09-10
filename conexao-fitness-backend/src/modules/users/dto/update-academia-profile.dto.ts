import { IsArray, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAcademiaProfileDto {
  @ApiPropertyOptional({ description: 'Nome fantasia da academia' })
  @IsOptional()
  @IsString()
  nomeFantasia?: string;

  @ApiPropertyOptional({ description: 'Razão social' })
  @IsOptional()
  @IsString()
  razaoSocial?: string;

  @ApiPropertyOptional({ description: 'CNPJ da academia' })
  @IsOptional()
  @IsString()
  cnpj?: string;

  @ApiPropertyOptional({ description: 'Biografia / Descrição da academia' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'URL da foto de capa / banner' })
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiPropertyOptional({ description: 'URL do avatar / logo' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Endereço completo (Rua, Número, Bairro)' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Cidade' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Estado (UF)' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'CEP' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ description: 'Telefone comercial' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'WhatsApp de atendimento' })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiPropertyOptional({ description: 'Instagram (@academia)' })
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiPropertyOptional({ description: 'Website oficial' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({
    description: 'Horários de funcionamento',
    example: { monday_friday: '06:00 - 23:00', saturday: '08:00 - 18:00', sunday_holidays: '09:00 - 14:00' },
  })
  @IsOptional()
  @IsObject()
  openingHours?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Comodidades e diferenciais (Wi-Fi, Climatizado, Estacionamento, etc.)',
    example: ['Musculação Completa', 'Área Cardio Climatizada', 'Vestiários com Chuveiro', 'Wi-Fi Gratuito'],
  })
  @IsOptional()
  @IsArray()
  facilities?: string[];

  @ApiPropertyOptional({
    description: 'Modalidades oferecidas na academia',
    example: ['Musculação', 'Spinning', 'Cross Training', 'Pilates', 'Muay Thai'],
  })
  @IsOptional()
  @IsArray()
  modalities?: string[];

  @ApiPropertyOptional({
    description: 'URLs das fotos da estrutura/instalações',
  })
  @IsOptional()
  @IsArray()
  galleryUrls?: string[];

  @ApiPropertyOptional({
    description: 'Preço da diária / Day Pass avulso Finex',
    example: 25.0,
  })
  @IsOptional()
  @IsNumber()
  dayPassPrice?: number;
}
