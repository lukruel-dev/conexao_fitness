import { IsUUID } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  serviceId: string;

  @IsUUID()
  slotId: string;

  @IsUUID()
  studentId: string;
}