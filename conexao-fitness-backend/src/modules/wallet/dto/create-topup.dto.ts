import { IsEnum, IsNumber, Min } from 'class-validator';

export class CreateTopupDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsEnum(['PIX', 'CARD'], { message: 'method must be PIX or CARD' } as any)
  method: 'PIX' | 'CARD';
}