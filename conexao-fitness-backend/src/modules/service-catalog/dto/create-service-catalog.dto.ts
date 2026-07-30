import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ServiceType } from '../../services/entities/service.entity';

export class CreateServiceCatalogDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  modality: string;

  @ApiProperty({ required: false, default: 60 })
  @IsInt()
  @IsOptional()
  durationMinutes?: number;

  @ApiProperty({ enum: ServiceType, default: ServiceType.SESSAO })
  @IsEnum(ServiceType)
  @IsOptional()
  type?: ServiceType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
