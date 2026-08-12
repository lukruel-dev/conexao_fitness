import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './modules/users/entities/user.entity';
import { Subscription, SubscriptionStatus } from './modules/payments/entities/subscription.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const usersRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const subsRepo = app.get<Repository<Subscription>>(getRepositoryToken(Subscription));

  console.log('🚀 Iniciando script de distribuição de planos...');

  const users = await usersRepo.find();
  console.log(`Encontrados ${users.length} usuários.`);

  let createdCount = 0;

  for (const user of users) {
    const existingSub = await subsRepo.findOne({
      where: { userId: user.id, status: SubscriptionStatus.ACTIVE },
    });

    if (!existingSub) {
      const newSub = subsRepo.create({
        userId: user.id,
        planName: 'Gratuito',
        status: SubscriptionStatus.ACTIVE,
      });
      await subsRepo.save(newSub);
      createdCount++;
    }
  }

  console.log(`✅ Planos Gratuito distribuídos com sucesso para ${createdCount} usuários sem assinatura.`);
  await app.close();
}

bootstrap().catch(err => {
  console.error('❌ Erro no script de distribuição de planos:', err);
  process.exit(1);
});
