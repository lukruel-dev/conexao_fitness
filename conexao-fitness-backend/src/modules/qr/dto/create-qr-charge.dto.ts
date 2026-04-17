import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateQrChargeDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  // em minutos; opcional
  @IsOptional()
  @IsNumber()
  @Min(1)
  expiresInMinutes?: number;
}