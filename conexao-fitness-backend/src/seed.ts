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
import { ServiceCatalog } from './modules/service-catalog/entities/service-catalog.entity';
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
  const catalogRepo = app.get<Repository<ServiceCatalog>>(getRepositoryToken(ServiceCatalog));

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
    const isDayPass =
      srv.type === ServiceType.DIARIA ||
      srv.type === ServiceType.DAY_PASS ||
      (srv.durationMinutes && srv.durationMinutes >= 720) ||
      srv.name.toLowerCase().includes('day pass') ||
      srv.providerType === ProviderType.ACADEMIA;
    const hours = isDayPass ? [6] : timesToGenerate;

    for (let dayOffset = 1; dayOffset <= 3; dayOffset++) {
      for (const hour of hours) {
        const startsAt = new Date(now);
        startsAt.setDate(now.getDate() + dayOffset);
        startsAt.setHours(hour, 0, 0, 0);

        const duration = isDayPass ? 1440 : (srv.durationMinutes || 60);
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

  // 9. Populando o Catálogo Base de Serviços
  console.log('📚 Populando Catálogo Base de Serviços...');
  const baseCatalogItems = [
    { name: 'Treino Personalizado de Musculação (Hipertrofia/Força)', modality: 'Musculação', durationMinutes: 60, type: ServiceType.SESSAO, description: 'Acompanhamento individual focado em hipertrofia, biomecânica dos exercícios e controle de cargas.' },
    { name: 'Avaliação Física Completa + Bioimpedância', modality: 'Musculação', durationMinutes: 45, type: ServiceType.SESSAO, description: 'Medição de dobras cutâneas, percentual de gordura, massa magra e teste de carga máxima.' },
    { name: 'Montagem de Ficha & Prescrição de Treino Individual', modality: 'Musculação', durationMinutes: 60, type: ServiceType.SESSAO, description: 'Elaboração de rotina semanal de treinos personalizada de acordo com seu objetivo e nível de experiência.' },
    { name: 'Consultoria de Treino Presencial + Acompanhamento', modality: 'Musculação', durationMinutes: 60, type: ServiceType.SESSAO, description: 'Orientação postural e correção da execução de movimentos complexos (agachamento, terra, supino).' },

    { name: 'Treinamento Funcional de Alta Intensidade (HIIT)', modality: 'Funcional', durationMinutes: 50, type: ServiceType.SESSAO, description: 'Circuito dinâmico focado em queima calórica, agilidade, mobilidade e condicionamento cardiorrespiratório.' },
    { name: 'Sessão Individual de CrossFit / WOD Personalizado', modality: 'CrossFit', durationMinutes: 60, type: ServiceType.SESSAO, description: 'Treino focado em técnicas de LPO (Levantamento de Peso Olímpico), ginásticos e WOD intenso adaptado.' },
    { name: 'Treino de Mobilidade e Estabilidade Articular', modality: 'Funcional', durationMinutes: 45, type: ServiceType.SESSAO, description: 'Exercícios focados em amplitude de movimento, prevenção de lesões e fortalecimento do core.' },

    { name: 'Aula de Hatha Yoga & Meditação Guiada', modality: 'Yoga', durationMinutes: 60, type: ServiceType.SESSAO, description: 'Prática restaurativa de posturas (asanas), exercícios respiratórios (pranayamas) e relaxamento profundo.' },
    { name: 'Vinyasa Flow Yoga (Fortalecimento & Flexibilidade)', modality: 'Yoga', durationMinutes: 60, type: ServiceType.SESSAO, description: 'Sequência fluida e dinâmica conectando movimento e respiração para ganho de resistência muscular.' },
    { name: 'Pilates Solo (Mat Pilates & Acessórios)', modality: 'Pilates', durationMinutes: 50, type: ServiceType.SESSAO, description: 'Fortalecimento do powerhouse (core), alinhamento postural e controle muscular utilizando bola e elásticos.' },
    { name: 'Pilates Clínico / Aparelhos (Reformer & Cadillac)', modality: 'Pilates', durationMinutes: 50, type: ServiceType.SESSAO, description: 'Sessão em aparelhos especializados para reabilitação postural, dores na coluna e ganho de força profunda.' },

    { name: 'Consulta Nutricional Esportiva + Plano Alimentar', modality: 'Nutrição', durationMinutes: 60, type: ServiceType.SESSAO, description: 'Plano nutricional focado em ganho de massa, definição muscular ou alta performance com cálculo de macros.' },
    { name: 'Avaliação Nutricional por Bioimpedância Tetrapolar', modality: 'Nutrição', durationMinutes: 30, type: ServiceType.SESSAO, description: 'Análise detalhada de gordura corporal, massa muscular, água corporal total e taxa metabólica basal.' },
    { name: 'Acompanhamento Nutricional Mensal (Revisão & Ajuste)', modality: 'Nutrição', durationMinutes: 45, type: ServiceType.SESSAO, description: 'Retorno para acompanhamento de resultados, evolução de medidas e ajustes no cardápio diário.' },

    { name: 'Sessão de Fisioterapia Desportiva / Reabilitação', modality: 'Fisioterapia', durationMinutes: 50, type: ServiceType.SESSAO, description: 'Tratamento de lesões articulares (joelho, ombro, tornozelo), analgesia e retorno seguro ao esporte.' },
    { name: 'Liberação Miofascial Instrumental & Manual (Recovery)', modality: 'Fisioterapia', durationMinutes: 45, type: ServiceType.SESSAO, description: 'Alívio de pontos gatilho (trigger points), redução de nós de tensão muscular e aceleração na recuperação.' },
    { name: 'Ventosaterapia & Terapia de Alívio de Dores', modality: 'Fisioterapia', durationMinutes: 45, type: ServiceType.SESSAO, description: 'Melhoria da circulação sanguínea local, oxigenação dos tecidos musculares e relaxamento profundo.' },

    { name: 'Massagem Desportiva Pré / Pós-Treino', modality: 'Massoterapia', durationMinutes: 60, type: ServiceType.SESSAO, description: 'Massagem profunda para ativação pré-competitiva ou redução de fadiga e ácido lático pós-treino.' },
    { name: 'Massagem Relaxante & Terapêutica', modality: 'Massoterapia', durationMinutes: 60, type: ServiceType.SESSAO, description: 'Redução de estresse, tensão muscular acumulada nas costas, pescoço e ombros com óleos essenciais.' },

    { name: 'Day Pass (Passe Diário) - Musculação & Vestiário', modality: 'Academia', durationMinutes: 1440, type: ServiceType.DIARIA, description: 'Acesso total durante 1 dia completo aos equipamentos de musculação, ergometria e infraestrutura.' },
    { name: 'Passe Semanal (7 Dias Livre Acesso)', modality: 'Academia', durationMinutes: 10080, type: ServiceType.PLANO_MENSAL, description: 'Acesso ilimitado por 7 dias corridos a todas as áreas da academia.' },
  ];

  for (const item of baseCatalogItems) {
    const existing = await catalogRepo.findOne({ where: { name: item.name } });
    if (!existing) {
      const catalogEntry = catalogRepo.create({
        name: item.name,
        modality: item.modality,
        durationMinutes: item.durationMinutes,
        type: item.type,
        description: item.description,
        isActive: true,
      });
      await catalogRepo.save(catalogEntry);
    }
  }
  console.log(`✅ ${baseCatalogItems.length} itens do Catálogo Base processados no banco!`);

  console.log('🎉 Seeding, Catálogo Base e horários das agendas concluídos com sucesso!');
  await app.close();
}

bootstrap().catch(err => {
  console.error('❌ Erro no seeding:', err);
  process.exit(1);
});
