import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PaymentsService } from './src/modules/payments/payments.service';
import { ServicesService } from './src/modules/services/services.service';
import { User } from './src/modules/users/entities/user.entity';
import { SubscriptionStatus } from './src/modules/payments/entities/subscription.entity';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const paymentsService = app.get(PaymentsService);
  const servicesService = app.get(ServicesService);

  console.log('Finding a provider user...');
  const userRepo = dataSource.getRepository(User);
  const provider = await userRepo.findOne({ where: { role: 'PERSONAL' } });

  if (!provider) {
    console.log('No PERSONAL found');
    process.exit(1);
  }

  console.log(`Using provider: ${provider.name} (${provider.id})`);

  console.log('Mocking a pending subscription...');
  const subRepo = dataSource.getRepository('Subscription');
  let sub = await subRepo.save({
    userId: provider.id,
    planName: 'Premium Plan',
    status: SubscriptionStatus.PENDING,
  });

  console.log(`Activating subscription (like the webhook would do)...`);
  await paymentsService.activateSubscription(provider.id, 'sub_mock_123');

  console.log('Fetching services to check the Premium Boost...');
  const services = await servicesService.findAll();
  
  for (const s of services) {
    console.log(`Service: ${s.name} | Boost: ${s.boostScore} | Premium: ${s.isPremium} | Rating: ${s.providerRating}`);
  }

  await app.close();
}

bootstrap().catch(console.error);
