import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { BookingsService } from './src/modules/bookings/bookings.service';
import { ServicesService } from './src/modules/services/services.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './src/modules/users/entities/user.entity';
import { ScheduleSlotStatus } from './src/modules/services/enums/schedule-slot-status.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const bookingsService = app.get(BookingsService);
  const servicesService = app.get(ServicesService);
  const userRepo = app.get(getRepositoryToken(User));

  const student = await userRepo.findOne({ where: { email: 'student@test.com' } });
  if (!student) throw new Error('Student not found');

  const services = await servicesService.findAll();
  if (services.length === 0) throw new Error('No services found');
  
  const service = services[0];
  const slots = await servicesService.listScheduleSlotsForService(service.id);
  const availableSlot = slots.find(s => s.status === ScheduleSlotStatus.AVAILABLE);

  if (!availableSlot) {
    console.log('No available slots. Run seed again.');
    process.exit(0);
  }

  console.log(`Booking service ${service.name} for slot ${availableSlot.id}...`);

  const createBookingDto = {
    serviceId: service.id,
    slotId: availableSlot.id,
  };
  const result = await bookingsService.createBooking(createBookingDto, student.id);

  console.log('Booking Result:', result);
  
  await app.close();
}

bootstrap();
