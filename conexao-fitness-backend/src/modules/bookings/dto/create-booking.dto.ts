import { IsUUID, IsOptional } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  serviceId: string;

  @IsUUID()
  slotId: string;

  @IsOptional()
  @IsUUID()
  studentId?: string;
}
