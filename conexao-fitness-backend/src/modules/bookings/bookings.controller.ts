import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { FilterBookingsDto } from './dto/filter-bookings.dto';
import { Booking } from './entities/booking.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Reservas (Bookings)')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /**
   * POST /bookings
   * Cria uma nova reserva.
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() dto: CreateBookingDto,
    @CurrentUser() user: any,
  ): Promise<any> {
    return this.bookingsService.createBooking(dto, user.id);
  }

  /**
   * PATCH /bookings/:bookingId/cancel
   * Cancela uma reserva existente.
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':bookingId/cancel')
  cancel(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @CurrentUser() user: any,
  ): Promise<Booking> {
    return this.bookingsService.cancelBooking(bookingId, user.id);
  }

  /**
   * GET /bookings/students/:studentId
   * Lista todos os bookings de um aluno, com filtro opcional ?status=CONFIRMED|CANCELLED|PENDING
   */
  @UseGuards(JwtAuthGuard)
  @Get('students/:studentId')
  findByStudent(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query() filter: FilterBookingsDto,
  ): Promise<Booking[]> {
    return this.bookingsService.listStudentBookings(studentId, filter);
  }

  /**
   * GET /bookings/services/:serviceId
   * Lista todos os bookings de um service, com filtro opcional ?status=CONFIRMED|CANCELLED|PENDING
   */
  @UseGuards(JwtAuthGuard)
  @Get('services/:serviceId')
  findByService(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Query() filter: FilterBookingsDto,
  ): Promise<Booking[]> {
    return this.bookingsService.listServiceBookings(serviceId, filter);
  }
}
