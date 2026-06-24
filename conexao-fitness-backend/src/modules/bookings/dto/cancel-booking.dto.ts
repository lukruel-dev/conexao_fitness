import { IsUUID } from 'class-validator';

/**
 * DTO para cancelamento de booking.
 * studentId é quem está solicitando o cancelamento —
 * o service valida que é o dono do booking.
 */
export class CancelBookingDto {
  @IsUUID()
  studentId: string;
}
