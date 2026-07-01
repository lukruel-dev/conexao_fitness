import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ReviewsService } from './src/modules/reviews/reviews.service';
import { ServicesService } from './src/modules/services/services.service';
import { BookingsService } from './src/modules/bookings/bookings.service';
import { BookingStatus } from './src/modules/bookings/entities/booking.entity';
import { User } from './src/modules/users/entities/user.entity';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const reviewsService = app.get(ReviewsService);
  const servicesService = app.get(ServicesService);
  const dataSource = app.get(DataSource);

  console.log('Fetching a confirmed booking...');
  // We need a CONFIRMED booking to review.
  const bookingRepo = dataSource.getRepository('Booking');
  let booking = await bookingRepo.findOne({ where: { status: BookingStatus.CONFIRMED } });

  if (!booking) {
    console.log('No CONFIRMED booking found. Finding a PENDING one to confirm...');
    booking = await bookingRepo.findOne({ where: { status: BookingStatus.PENDING } });
    if (booking) {
      await bookingRepo.update(booking.id, { status: BookingStatus.CONFIRMED });
      console.log(`Confirmed booking ${booking.id}`);
    } else {
      console.log('No booking found to test.');
      process.exit(1);
    }
  }

  console.log(`Using Booking ID: ${booking.id} (Student: ${booking.studentId})`);

  try {
    console.log('Creating a 4-star review...');
    const review = await reviewsService.createReview({
      bookingId: booking.id,
      rating: 4,
      comment: 'Ótima aula, mas o professor atrasou 5 minutos.',
    }, booking.studentId);
    
    console.log('Review created successfully:', review.id);
  } catch (error) {
    console.log('Error creating review (maybe already reviewed?):', error.message);
  }

  console.log('Testing ServicesService.findAll to see ordering and rating...');
  const services = await servicesService.findAll();
  
  for (const s of services) {
    console.log(`Service: ${s.name} | Rating: ${s.providerRating} | Reviews: ${s.totalReviews} | Boost: ${s.boostScore}`);
  }

  await app.close();
}

bootstrap().catch(console.error);
