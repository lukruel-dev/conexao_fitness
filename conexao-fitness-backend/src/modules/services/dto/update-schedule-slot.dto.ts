import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ScheduleSlotStatus } from '../enums/schedule-slot-status.enum';

export class UpdateScheduleSlotDto {
  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @IsDateString()
  @IsOptional()
  endsAt?: string;

  @IsEnum(ScheduleSlotStatus)
  @IsOptional()
  status?: ScheduleSlotStatus;

  @IsUUID()
  @IsOptional()
  studentId?: string;
}