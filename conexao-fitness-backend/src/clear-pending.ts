import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from './modules/bookings/entities/booking.entity';
import { ScheduleSlot } from './modules/services/entities/schedule-slot.entity';
import { ScheduleSlotStatus } from './modules/services/enums/schedule-slot-status.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const bookingsRepo = app.get<Repository<Booking>>(getRepositoryToken(Booking));
  const slotsRepo = app.get<Repository<ScheduleSlot>>(getRepositoryToken(ScheduleSlot));

  console.log('Procurando bookings PENDENTES...');
  const pendingBookings = await bookingsRepo.find({
    where: { status: BookingStatus.PENDING },
    relations: ['slot'],
  });

  if (pendingBookings.length === 0) {
    console.log('Nenhum booking PENDENTE encontrado.');
  } else {
    for (const booking of pendingBookings) {
      if (booking.slot) {
        booking.slot.status = ScheduleSlotStatus.AVAILABLE;
        await slotsRepo.save(booking.slot);
      }
      await bookingsRepo.remove(booking);
      console.log(`Booking PENDENTE deletado e Slot liberado: ${booking.id}`);
    }
    console.log(`Total de ${pendingBookings.length} reservas canceladas.`);
  }

  await app.close();
}

bootstrap().catch(console.error);
