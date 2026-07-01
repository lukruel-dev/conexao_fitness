import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker/locale/pt_BR';

import { User, UserRole, UserStatus } from './modules/users/entities/user.entity';
import { PersonalProfile } from './modules/users/entities/personal-profile.entity';
import { AlunoProfile } from './modules/users/entities/aluno-profile.entity';
import { AcademiaProfile } from './modules/users/entities/academia-profile.entity';
import { Service as AppService, ProviderType, ServiceType } from './modules/services/entities/service.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const usersRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const personalRepo = app.get<Repository<PersonalProfile>>(getRepositoryToken(PersonalProfile));
  const alunoRepo = app.get<Repository<AlunoProfile>>(getRepositoryToken(AlunoProfile));
  const academiaRepo = app.get<Repository<AcademiaProfile>>(getRepositoryToken(AcademiaProfile));
  const servicesRepo = app.get<Repository<AppService>>(getRepositoryToken(AppService));

  const passwordHash = await bcrypt.hash('123456', 10);
  console.log('Iniciando Seeding do Banco de Dados...');

  // 1. Criar ADMIN
  const existingAdmin = await usersRepo.findOne({ where: { role: 'ADMIN' } });
  if (!existingAdmin) {
    const admin = usersRepo.create({
      name: 'Administrador Supremo',
      email: 'admin@conexaofitness.com',
      passwordHash,
      role: 'ADMIN',
      status: 'ATIVO',
      avatarUrl: faker.image.avatar(),
    });
    await usersRepo.save(admin);
    console.log('✅ Admin criado (admin@conexaofitness.com | 123456)');
  }

  // 2. Criar Alunos Fakes
  console.log('Criando 50 Alunos falsos...');
  for (let i = 0; i < 50; i++) {
    const user = usersRepo.create({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      passwordHash,
      role: 'STUDENT',
      status: 'ATIVO',
      avatarUrl: faker.image.avatar(),
      phone: faker.phone.number(),
      cityBase: faker.location.city(),
      lastLat: faker.location.latitude({ max: -22, min: -24 }), // Região SP/RJ aproximado
      lastLng: faker.location.longitude({ max: -43, min: -47 }),
    });
    const savedUser = await usersRepo.save(user);

    const aluno = alunoRepo.create({
      user: savedUser,
      fullName: savedUser.name,
      preferredModalities: faker.helpers.arrayElements(['Musculação', 'Pilates', 'Crossfit', 'Yoga'], 2),
    });
    await alunoRepo.save(aluno);
  }
  console.log('✅ 50 Alunos criados.');

  // 3. Criar Profissionais (Diversos)
  const professions = ['Personal Trainer', 'Nutricionista', 'Fisioterapeuta', 'Massoterapeuta', 'Osteopata', 'Coach Esportivo'];
  console.log('Criando 30 Profissionais falsos...');
  for (let i = 0; i < 30; i++) {
    const user = usersRepo.create({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      passwordHash,
      role: 'PERSONAL',
      status: 'ATIVO', // Vamos deixar ativo para aparecer na busca
      avatarUrl: faker.image.avatar(),
      phone: faker.phone.number(),
      cityBase: faker.location.city(),
      lastLat: faker.location.latitude({ max: -22, min: -24 }),
      lastLng: faker.location.longitude({ max: -43, min: -47 }),
      averageRating: faker.number.float({ min: 4.0, max: 5.0, fractionDigits: 1 }),
      totalReviews: faker.number.int({ min: 5, max: 120 }),
    });
    const savedUser = await usersRepo.save(user);

    const professionTitle = faker.helpers.arrayElement(professions);
    
    const personal = personalRepo.create({
      user: savedUser,
      publicName: savedUser.name,
      professionTitle: professionTitle,
      bio: faker.lorem.paragraph(),
      modalities: ['Atendimento Híbrido', 'Presencial', 'Consultoria Online'],
      serviceRadiusKm: faker.number.int({ min: 5, max: 30 }),
      baseHourlyPrice: faker.commerce.price({ min: 50, max: 200, dec: 2 }),
      cref: professionTitle === 'Personal Trainer' ? faker.string.alphanumeric(10) : undefined,
    });
    await personalRepo.save(personal);

    // Criar um serviço para este profissional
    const service = servicesRepo.create({
      providerType: ProviderType.PERSONAL,
      providerId: savedUser.id,
      name: `Consulta com ${professionTitle}`,
      description: faker.lorem.sentences(2),
      price: personal.baseHourlyPrice || '100',
      durationMinutes: 60,
      modality: 'PRESENCIAL',
      type: ServiceType.SESSAO,
      isActive: true,
    });
    await servicesRepo.save(service);
  }
  console.log('✅ 30 Profissionais e Serviços criados.');

  // 4. Criar Academias
  console.log('Criando 10 Academias falsas...');
  for (let i = 0; i < 10; i++) {
    const user = usersRepo.create({
      name: faker.company.name() + ' Fitness',
      email: faker.internet.email(),
      passwordHash,
      role: 'ACADEMIA',
      status: 'ATIVO',
      avatarUrl: faker.image.urlLoremFlickr({ category: 'gym' }),
      phone: faker.phone.number(),
      cityBase: faker.location.city(),
      lastLat: faker.location.latitude({ max: -22, min: -24 }),
      lastLng: faker.location.longitude({ max: -43, min: -47 }),
      averageRating: faker.number.float({ min: 4.2, max: 5.0, fractionDigits: 1 }),
      totalReviews: faker.number.int({ min: 10, max: 300 }),
    });
    const savedUser = await usersRepo.save(user);

    const academia = academiaRepo.create({
      user: savedUser,
      razaoSocial: savedUser.name,
      nomeFantasia: savedUser.name,
      cnpj: faker.string.numeric(14),
    });
    await academiaRepo.save(academia);

    // Serviço da Academia
    const service = servicesRepo.create({
      providerType: ProviderType.ACADEMIA,
      providerId: savedUser.id,
      name: `Diária - ${savedUser.name}`,
      description: 'Acesso livre a todas as áreas da academia por um dia inteiro.',
      price: faker.commerce.price({ min: 20, max: 80, dec: 2 }),
      durationMinutes: 1440, // 24h
      modality: 'PRESENCIAL',
      type: ServiceType.DIARIA,
      isActive: true,
    });
    await servicesRepo.save(service);
  }
  console.log('✅ 10 Academias e Serviços criados.');

  console.log('🎉 Seeding finalizado com sucesso!');
  await app.close();
}

bootstrap().catch(err => {
  console.error('Erro no seeding:', err);
  process.exit(1);
});
