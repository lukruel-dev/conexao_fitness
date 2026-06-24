import { IsEnum, IsOptional } from 'class-validator';
import { BookingStatus } from '../entities/booking.entity';

/**
 * Filtro opcional para listagens de bookings.
 * Todos os campos são opcionais para suportar listagens sem filtro.
 */
export class FilterBookingsDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
