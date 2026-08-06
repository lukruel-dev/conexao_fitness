import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profession } from './modules/professions/entities/profession.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const repo = app.get<Repository<Profession>>(getRepositoryToken(Profession));

  const mainProfessions = [
    'Personal Trainer',
    'Nutricionista',
    'Fisioterapeuta',
    'Massoterapeuta',
    'Professor de Dança',
    'Professor de Yoga',
    'Professor de Artes Marciais',
    'Instrutor de Pilates'
  ];

  for (const title of mainProfessions) {
    const existing = await repo.findOne({ where: { title } });
    if (!existing) {
      const p = repo.create({ title, isActive: true });
      await repo.save(p);
      console.log(`✅ Profissão inserida: ${title}`);
    } else {
      console.log(`ℹ️ Profissão já existe: ${title}`);
    }
  }

  await app.close();
}

bootstrap().catch(err => {
  console.error('❌ Erro no seeding de profissões:', err);
  process.exit(1);
});
