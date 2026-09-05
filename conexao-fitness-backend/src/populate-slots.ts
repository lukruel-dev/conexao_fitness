import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service as AppService, ProviderType, ServiceType } from './modules/services/entities/service.entity';
import { ScheduleSlot } from './modules/services/entities/schedule-slot.entity';
import { ScheduleSlotStatus } from './modules/services/enums/schedule-slot-status.enum';

async function populateSlots() {
  console.log('🚀 Conectando ao banco de dados para gerar horários...');
  const app = await NestFactory.createApplicationContext(AppModule);

  const servicesRepo = app.get<Repository<AppService>>(getRepositoryToken(AppService));
  const slotsRepo = app.get<Repository<ScheduleSlot>>(getRepositoryToken(ScheduleSlot));

  const allServices = await servicesRepo.find({
    where: { isActive: true },
  });

  console.log(`📋 Encontrados ${allServices.length} serviços ativos.`);

  // Definir data inicial como amanhã ou hoje
  const now = new Date();
  
  // Criar dias até 30 de Setembro
  const year = now.getFullYear();
  const targetEnd = new Date(year, 8, 30, 23, 59, 59); // Mês 8 no JS é Setembro (0-indexado)

  const slotsToInsert: ScheduleSlot[] = [];
  const hoursPersonal = [7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20];
  const hoursAcademia = [6];

  for (const srv of allServices) {
    const isDayPass =
      srv.type === ServiceType.DIARIA ||
      srv.type === ServiceType.DAY_PASS ||
      (srv.durationMinutes && srv.durationMinutes >= 720) ||
      srv.name.toLowerCase().includes('day pass') ||
      srv.providerType === ProviderType.ACADEMIA;

    const hours = isDayPass ? hoursAcademia : hoursPersonal;
    const duration = isDayPass ? 1440 : (srv.durationMinutes || 60);

    // Iterar dia a dia a partir de hoje até 30 de setembro
    const currentCursor = new Date(now);
    currentCursor.setDate(currentCursor.getDate() + 1); // A partir de amanhã

    while (currentCursor <= targetEnd) {
      const dayOfWeek = currentCursor.getDay(); // 0 = Domingo
      // Se for domingo e não for academia, podemos pular ou colocar horário reduzido
      if (dayOfWeek === 0 && !isDayPass) {
        currentCursor.setDate(currentCursor.getDate() + 1);
        continue;
      }

      for (const hour of hours) {
        // No sábado, personal atende apenas até 12h
        if (dayOfWeek === 6 && !isDayPass && hour > 12) {
          continue;
        }

        const startsAt = new Date(currentCursor);
        startsAt.setHours(hour, 0, 0, 0);

        const endsAt = new Date(startsAt.getTime() + duration * 60000);

        const slot = slotsRepo.create({
          serviceId: srv.id,
          startsAt,
          endsAt,
          status: ScheduleSlotStatus.AVAILABLE,
        });

        slotsToInsert.push(slot);
      }

      currentCursor.setDate(currentCursor.getDate() + 1);
    }
  }

  console.log(`⏰ Total de slots calculados para inserção: ${slotsToInsert.length}`);

  // Inserir em lotes (batch) de 500 para performance ideal
  const batchSize = 500;
  for (let i = 0; i < slotsToInsert.length; i += batchSize) {
    const batch = slotsToInsert.slice(i, i + batchSize);
    await slotsRepo.save(batch);
    console.log(`✅ Lote salvo: ${Math.min(i + batchSize, slotsToInsert.length)}/${slotsToInsert.length}`);
  }

  console.log('🎉 Todos os horários até o final de setembro foram gerados e salvos com sucesso!');
  await app.close();
}

populateSlots().catch(err => {
  console.error('❌ Erro ao popular horários:', err);
  process.exit(1);
});
