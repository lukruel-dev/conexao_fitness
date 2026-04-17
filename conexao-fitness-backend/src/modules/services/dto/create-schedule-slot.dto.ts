import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ScheduleSlotStatus } from '../enums/schedule-slot-status.enum';

export class CreateScheduleSlotDto {
  @IsDateString()
  startsAt: string;

  @IsDateString()
  endsAt: string;

  @IsEnum(ScheduleSlotStatus)
  @IsOptional()
  status?: ScheduleSlotStatus;

  @IsUUID()
  @IsOptional()
  studentId?: string;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;
}