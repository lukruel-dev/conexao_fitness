import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ServicesService } from './src/modules/services/services.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './src/modules/users/entities/user.entity';
import { Service } from './src/modules/services/entities/service.entity';
import { Repository } from 'typeorm';
import { ProviderAvailability } from './src/modules/availability/entities/provider-availability.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const servicesService = app.get(ServicesService);
  
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const serviceRepo = app.get<Repository<Service>>(getRepositoryToken(Service));
  const availRepo = app.get<Repository<ProviderAvailability>>(getRepositoryToken(ProviderAvailability));

  const providers = await userRepo.find({ where: [{ role: 'PERSONAL' }, { role: 'ACADEMIA' }] });
  
  for (const provider of providers) {
    const existing = await availRepo.find({ where: { providerId: provider.id } });
    if (existing.length === 0) {
      for (let day = 1; day <= 6; day++) { // Monday to Saturday
        await availRepo.save({
          providerId: provider.id,
          dayOfWeek: day,
          startTime: '07:00',
          endTime: '21:00'
        });
      }
      console.log(`Created default availability for provider ${provider.name}`);
    }
  }

  const services = await serviceRepo.find();
  for (const service of services) {
    try {
      const result = await servicesService.generateSlotsForService(service.id, 14); // generate for 14 days
      console.log(`Generated ${result.createdCount} slots for service ${service.name}`);
    } catch (e) {
      console.error(`Error for service ${service.name}:`, e.message);
    }
  }

  await app.close();
}

bootstrap();
