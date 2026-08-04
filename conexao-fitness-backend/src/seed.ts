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
import { ScheduleSlot } from './modules/services/entities/schedule-slot.entity';
import { ScheduleSlotStatus } from './modules/services/enums/schedule-slot-status.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const usersRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const personalRepo = app.get<Repository<PersonalProfile>>(getRepositoryToken(PersonalProfile));
  const alunoRepo = app.get<Repository<AlunoProfile>>(getRepositoryToken(AlunoProfile));
  const academiaRepo = app.get<Repository<AcademiaProfile>>(getRepositoryToken(AcademiaProfile));
  const servicesRepo = app.get<Repository<AppService>>(getRepositoryToken(AppService));
  const slotsRepo = app.get<Repository<ScheduleSlot>>(getRepositoryToken(ScheduleSlot));

  const passwordHash = await bcrypt.hash('123456', 10);
  console.log('🚀 Iniciando Seeding do Banco de Dados Conexão Fitness...');

  // 1. Criar ADMIN Fixo
  const existingAdmin = await usersRepo.findOne({ where: { email: 'admin@conexaofitness.com.br' } });
  if (!existingAdmin) {
    const admin = usersRepo.create({
      name: 'Administrador Conexão Fitness',
      email: 'admin@conexaofitness.com.br',
      passwordHash,
      role: 'ADMIN',
      status: 'ATIVO',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      phone: '(55) 99999-0000',
      cityBase: 'Uruguaiana - RS',
    });
    await usersRepo.save(admin);
    console.log('✅ Admin criado (admin@conexaofitness.com.br | 123456)');
  }

  // 2. Criar ALUNO Teste Fixo
  const existingAluno = await usersRepo.findOne({ where: { email: 'aluno@conexaofitness.com.br' } });
  if (!existingAluno) {
    const userAluno = usersRepo.create({
      name: 'Lucas Aluno Teste',
      email: 'aluno@conexaofitness.com.br',
      passwordHash,
      role: 'STUDENT',
      status: 'ATIVO',
      phone: '(55) 99999-1111',
      cityBase: 'Uruguaiana - RS',
      lastLat: -29.7578,
      lastLng: -57.0872,
    });
    const savedAluno = await usersRepo.save(userAluno);
    const alunoProfile = alunoRepo.create({
      user: savedAluno,
      fullName: savedAluno.name,
      preferredModalities: ['Musculação', 'Nutrição Esportiva', 'Fisioterapia'],
    });
    await alunoRepo.save(alunoProfile);
    console.log('✅ Aluno Teste criado (aluno@conexaofitness.com.br | 123456)');
  }

  // 3. Criar PERSONAL TESTE FIXO (Uruguaiana - RS)
  const existingPersonal = await usersRepo.findOne({ where: { email: 'personal@conexaofitness.com.br' } });
  if (!existingPersonal) {
    const userPersonal = usersRepo.create({
      name: 'Prof. Diego Silva (CREF)',
      email: 'personal@conexaofitness.com.br',
      passwordHash,
      role: 'PERSONAL',
      status: 'ATIVO',
      avatarUrl: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=150',
      phone: '(55) 99999-2222',
      cityBase: 'Uruguaiana - RS',
      lastLat: -29.7580,
      lastLng: -57.0870,
      averageRating: 4.9,
      totalReviews: 48,
    });
    const savedPersonalUser = await usersRepo.save(userPersonal);

    const personalProfile = personalRepo.create({
      user: savedPersonalUser,
      publicName: savedPersonalUser.name,
      professionTitle: 'Personal Trainer & Preparador Físico',
      bio: 'Especialista em musculação, emagrecimento e condicionamento físico de alta performance em Uruguaiana - RS.',
      modalities: ['Presencial', 'Consultoria Online', 'Treino em Domicílio'],
      serviceRadiusKm: 25,
      baseHourlyPrice: '75.00',
      cref: '012345-G/RS',
    });
    await personalRepo.save(personalProfile);

    const servicePersonal = servicesRepo.create({
      providerType: ProviderType.PERSONAL,
      providerId: savedPersonalUser.id,
      name: 'Treino Personalizado Individual (60 min)',
      description: 'Sessão individual com acompanhamento biomecânico, ajuste de carga e foco no seu objetivo.',
      price: '75.00',
      durationMinutes: 60,
      modality: 'PRESENCIAL',
      type: ServiceType.SESSAO,
      isActive: true,
    });
    await servicesRepo.save(servicePersonal);
    console.log('✅ Personal Trainer Criado (personal@conexaofitness.com.br | 123456)');
  }

  // 4. Criar NUTRICIONISTA TESTE FIXO (Uruguaiana - RS)
  const existingNutri = await usersRepo.findOne({ where: { email: 'nutri@conexaofitness.com.br' } });
  if (!existingNutri) {
    const userNutri = usersRepo.create({
      name: 'Dra. Camila Santos (Nutricionista)',
      email: 'nutri@conexaofitness.com.br',
      passwordHash,
      role: 'PERSONAL',
      status: 'ATIVO',
      avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
      phone: '(55) 99999-3333',
      cityBase: 'Uruguaiana - RS',
      lastLat: -29.7565,
      lastLng: -57.0860,
      averageRating: 5.0,
      totalReviews: 32,
    });
    const savedNutriUser = await usersRepo.save(userNutri);

    const nutriProfile = personalRepo.create({
      user: savedNutriUser,
      publicName: savedNutriUser.name,
      professionTitle: 'Nutricionista Esportiva & Clinica',
      bio: 'Especializada em reeducação alimentar, hipertrofia, perda de gordura e acompanhamento nutricional para atletas.',
      modalities: ['Consulta Presencial', 'Teleconsulta Online'],
      serviceRadiusKm: 30,
      baseHourlyPrice: '140.00',
      cref: 'CRN 98765/RS',
    });
    await personalRepo.save(nutriProfile);

    const serviceNutri = servicesRepo.create({
      providerType: ProviderType.PERSONAL,
      providerId: savedNutriUser.id,
      name: 'Consulta Nutricional Esportiva + Bioimpedância',
      description: 'Avaliação da composição corporal, plano alimentar individualizado e orientação de suplementação.',
      price: '140.00',
      durationMinutes: 60,
      modality: 'PRESENCIAL',
      type: ServiceType.SESSAO,
      isActive: true,
    });
    await servicesRepo.save(serviceNutri);
    console.log('✅ Nutricionista Criada (nutri@conexaofitness.com.br | 123456)');
  }

  // 5. Criar FISIOTERAPEUTA TESTE FIXO (Uruguaiana - RS)
  const existingFisio = await usersRepo.findOne({ where: { email: 'fisio@conexaofitness.com.br' } });
  if (!existingFisio) {
    const userFisio = usersRepo.create({
      name: 'Dr. Rodrigo Oliveira (Fisioterapeuta)',
      email: 'fisio@conexaofitness.com.br',
      passwordHash,
      role: 'PERSONAL',
      status: 'ATIVO',
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
      phone: '(55) 99999-4444',
      cityBase: 'Uruguaiana - RS',
      lastLat: -29.7590,
      lastLng: -57.0880,
      averageRating: 4.9,
      totalReviews: 29,
    });
    const savedFisioUser = await usersRepo.save(userFisio);

    const fisioProfile = personalRepo.create({
      user: savedFisioUser,
      publicName: savedFisioUser.name,
      professionTitle: 'Fisioterapeuta Desportivo & Osteopata',
      bio: 'Reabilitação de lesões articulares e musculares, fisioterapia preventiva desportiva e liberação miofascial.',
      modalities: ['Atendimento em Consultório', 'Domiciliar'],
      serviceRadiusKm: 20,
      baseHourlyPrice: '130.00',
      cref: 'CREFITO 54321/RS',
    });
    await personalRepo.save(fisioProfile);

    const serviceFisio = servicesRepo.create({
      providerType: ProviderType.PERSONAL,
      providerId: savedFisioUser.id,
      name: 'Sessão de Fisioterapia & Liberação Miofascial',
      description: 'Tratamento de dores crônicas, recuperação muscular pós-treino e alinhamento postural.',
      price: '130.00',
      durationMinutes: 50,
      modality: 'PRESENCIAL',
      type: ServiceType.SESSAO,
      isActive: true,
    });
    await servicesRepo.save(serviceFisio);
    console.log('✅ Fisioterapeuta Criado (fisio@conexaofitness.com.br | 123456)');
  }

  // 6. Criar ACADEMIA TESTE FIXA (Uruguaiana - RS)
  const existingAcademia = await usersRepo.findOne({ where: { email: 'academia@conexaofitness.com.br' } });
  if (!existingAcademia) {
    const userAcademia = usersRepo.create({
      name: 'Academia Conexão VIP Uruguaiana',
      email: 'academia@conexaofitness.com.br',
      passwordHash,
      role: 'ACADEMIA',
      status: 'ATIVO',
      avatarUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150',
      phone: '(55) 3411-9999',
      cityBase: 'Uruguaiana - RS',
      lastLat: -29.7570,
      lastLng: -57.0850,
      averageRating: 4.8,
      totalReviews: 120,
    });
    const savedAcademiaUser = await usersRepo.save(userAcademia);

    const academiaProfile = academiaRepo.create({
      user: savedAcademiaUser,
      razaoSocial: 'Academia Conexão VIP LTDA',
      nomeFantasia: 'Conexão VIP Uruguaiana',
      cnpj: '12345678000199',
    });
    await academiaRepo.save(academiaProfile);

    const serviceAcademiaDayPass = servicesRepo.create({
      providerType: ProviderType.ACADEMIA,
      providerId: savedAcademiaUser.id,
      name: 'Day Pass (Passe Diário) - Musculação & Cardio',
      description: 'Acesso total durante um dia inteiro aos equipamentos de musculação, área cardiovascular e vestiários climatizados.',
      price: '25.00',
      durationMinutes: 1440,
      modality: 'PRESENCIAL',
      type: ServiceType.DIARIA,
      isActive: true,
    });
    await servicesRepo.save(serviceAcademiaDayPass);
    console.log('✅ Academia VIP Criada (academia@conexaofitness.com.br | 123456)');
  }

  // 7. Criar massa de dados fictícia adicional no Brasil (Alunos, Personals, Nutricionistas, Fisioterapeutas e Academias)
  console.log('📦 Criando massa complementar de 20 profissionais e 10 academias no Brasil...');
  const roles = ['Personal Trainer', 'Nutricionista', 'Fisioterapeuta', 'Massoterapeuta'];

  for (let i = 0; i < 20; i++) {
    const pTitle = faker.helpers.arrayElement(roles);
    const user = usersRepo.create({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      passwordHash,
      role: 'PERSONAL',
      status: 'ATIVO',
      avatarUrl: faker.image.avatar(),
      phone: faker.phone.number(),
      cityBase: faker.helpers.arrayElement(['Porto Alegre - RS', 'São Paulo - SP', 'Curitiba - PR', 'Uruguaiana - RS']),
      lastLat: faker.location.latitude({ max: -22, min: -30 }),
      lastLng: faker.location.longitude({ max: -43, min: -57 }),
      averageRating: faker.number.float({ min: 4.3, max: 5.0, fractionDigits: 1 }),
      totalReviews: faker.number.int({ min: 8, max: 80 }),
    });
    const savedUser = await usersRepo.save(user);

    const personal = personalRepo.create({
      user: savedUser,
      publicName: savedUser.name,
      professionTitle: pTitle,
      bio: faker.lorem.sentence(),
      modalities: ['Presencial', 'Online'],
      serviceRadiusKm: faker.number.int({ min: 10, max: 40 }),
      baseHourlyPrice: faker.commerce.price({ min: 60, max: 180, dec: 2 }),
      cref: `${pTitle.slice(0, 3).toUpperCase()} ${faker.string.numeric(5)}/RS`,
    });
    await personalRepo.save(personal);

    const service = servicesRepo.create({
      providerType: ProviderType.PERSONAL,
      providerId: savedUser.id,
      name: `Atendimento de ${pTitle}`,
      description: faker.lorem.sentence(),
      price: personal.baseHourlyPrice || '90.00',
      durationMinutes: 60,
      modality: 'PRESENCIAL',
      type: ServiceType.SESSAO,
      isActive: true,
    });
    await servicesRepo.save(service);
  }

  // 8. Gerar horários (vagas) para teste em TODOS os serviços cadastrados
  console.log('⏰ Gerando horários (ScheduleSlots) nas agendas para testes...');
  const allServices = await servicesRepo.find();
  const timesToGenerate = [8, 10, 14, 16, 18, 19]; // 6 horários por dia
  const slotsToInsert: ScheduleSlot[] = [];

  for (const srv of allServices) {
    const now = new Date();
    for (let dayOffset = 1; dayOffset <= 3; dayOffset++) {
      for (const hour of timesToGenerate) {
        const startsAt = new Date(now);
        startsAt.setDate(now.getDate() + dayOffset);
        startsAt.setHours(hour, 0, 0, 0);

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

  if (slotsToInsert.length > 0) {
    await slotsRepo.save(slotsToInsert);
    console.log(`✅ ${slotsToInsert.length} horários criados nas agendas!`);
  }

  console.log('🎉 Seeding e horários das agendas concluídos com sucesso!');
  await app.close();
}

bootstrap().catch(err => {
  console.error('❌ Erro no seeding:', err);
  process.exit(1);
});
