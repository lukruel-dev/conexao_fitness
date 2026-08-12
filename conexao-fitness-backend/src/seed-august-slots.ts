import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service as AppService } from './modules/services/entities/service.entity';
import { ScheduleSlot } from './modules/services/entities/schedule-slot.entity';
import { ScheduleSlotStatus } from './modules/services/enums/schedule-slot-status.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const servicesRepo = app.get<Repository<AppService>>(getRepositoryToken(AppService));
  const slotsRepo = app.get<Repository<ScheduleSlot>>(getRepositoryToken(ScheduleSlot));

  console.log('🚀 Iniciando script para popular horários de Agosto de 2026...');

  const allServices = await servicesRepo.find({ where: { isActive: true } });
  console.log(`Encontrados ${allServices.length} serviços ativos.`);

  const timesToGenerate = [8, 10, 14, 16, 18, 19]; // 6 horários por dia
  const slotsToInsert: ScheduleSlot[] = [];

  // Mês de Agosto de 2026: Dias 1 a 31
  for (const srv of allServices) {
    for (let day = 1; day <= 31; day++) {
      for (const hour of timesToGenerate) {
        // Mês é 0-indexado em JS (7 = Agosto)
        const startsAt = new Date(2026, 7, day, hour, 0, 0, 0);
        
        const duration = srv.durationMinutes || 60;
        const endsAt = new Date(startsAt.getTime() + duration * 60000);

        const slot = slotsRepo.create({
          serviceId: srv.id,
          startsAt,
          endsAt,
          status: ScheduleSlotStatus.AVAILABLE,
        });
        slotsToInsert.push(slot);
      }
    }
  }

  // Insert in chunks to avoid memory/packet issues if the array is too large
  const chunkSize = 1000;
  for (let i = 0; i < slotsToInsert.length; i += chunkSize) {
    const chunk = slotsToInsert.slice(i, i + chunkSize);
    await slotsRepo.save(chunk);
    console.log(`Inserido lote de ${chunk.length} horários (${i + chunk.length} de ${slotsToInsert.length})...`);
  }

  console.log(`✅ Total de ${slotsToInsert.length} horários criados para Agosto de 2026!`);
  await app.close();
}

bootstrap().catch(err => {
  console.error('❌ Erro no script de horários:', err);
  process.exit(1);
});
