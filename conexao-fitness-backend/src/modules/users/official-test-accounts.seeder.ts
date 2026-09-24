import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { AlunoProfile } from './entities/aluno-profile.entity';
import { PersonalProfile } from './entities/personal-profile.entity';
import { AcademiaProfile } from './entities/academia-profile.entity';
import { WalletAccount } from '../wallet/entities/wallet-account.entity';
import { Service as AppService, ServiceType, ProviderType } from '../services/entities/service.entity';
import { ScheduleSlot } from '../services/entities/schedule-slot.entity';
import { ScheduleSlotStatus } from '../services/enums/schedule-slot-status.enum';
import { MembershipPlan } from '../memberships/entities/membership-plan.entity';
import { ServiceCatalog } from '../service-catalog/entities/service-catalog.entity';

export interface SeederRepositories {
  usersRepo: Repository<User>;
  alunoRepo: Repository<AlunoProfile>;
  personalRepo: Repository<PersonalProfile>;
  academiaRepo: Repository<AcademiaProfile>;
  walletRepo: Repository<WalletAccount>;
  servicesRepo: Repository<AppService>;
  slotsRepo?: Repository<ScheduleSlot>;
  planRepo?: Repository<MembershipPlan>;
  catalogRepo?: Repository<ServiceCatalog>;
}

export async function seedOfficialFinexAccounts(repos: SeederRepositories): Promise<void> {
  const {
    usersRepo,
    alunoRepo,
    personalRepo,
    academiaRepo,
    walletRepo,
    servicesRepo,
    slotsRepo,
    planRepo,
    catalogRepo,
  } = repos;

  const passwordHash = await bcrypt.hash('123456', 10);

  // Helper para criar ou atualizar usuário
  async function upsertUser(data: Partial<User>): Promise<User> {
    let user = await usersRepo.findOne({ where: { email: data.email } });
    if (!user) {
      user = usersRepo.create({
        ...data,
        passwordHash,
        isEmailVerified: true,
        status: 'ATIVO',
      });
    } else {
      user.name = data.name || user.name;
      user.role = data.role || user.role;
      if (!user.passwordHash) {
        user.passwordHash = passwordHash;
      }
      user.isEmailVerified = true;
      user.status = 'ATIVO';
      user.avatarUrl = data.avatarUrl || user.avatarUrl;
      user.phone = data.phone || user.phone;
      user.cityBase = data.cityBase || user.cityBase;
      user.bio = data.bio || user.bio;
    }
    return usersRepo.save(user);
  }

  // Helper para garantir carteira com saldo inicial sem sobrescrever histórico
  async function ensureWallet(userId: string, balance: number = 0) {
    let wallet = await walletRepo.findOne({ where: { ownerId: userId, ownerType: 'USER' } });
    if (!wallet) {
      wallet = walletRepo.create({
        ownerId: userId,
        ownerType: 'USER',
        currency: 'BRL',
        currentBalance: balance.toFixed(2),
        pendingBalance: '0.00',
        status: 'ACTIVE',
      });
      await walletRepo.save(wallet);
    }
  }

  // 1. ADMIN
  const admin = await upsertUser({
    name: 'Administrador Finex',
    email: 'admin@finex.net.br',
    role: 'ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    phone: '(55) 99999-0001',
    cityBase: 'Uruguaiana - RS',
    bio: 'Administrador geral da plataforma Finex.',
  });
  await ensureWallet(admin.id, 0);

  // 2. ALUNO
  const aluno = await upsertUser({
    name: 'Lucas Atleta (Aluno)',
    email: 'aluno@finex.net.br',
    role: 'STUDENT',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300',
    phone: '(55) 99999-0002',
    cityBase: 'Uruguaiana - RS',
    bio: 'Praticante de musculação e treinamento funcional focado em hipertrofia e bem-estar.',
  });
  await ensureWallet(aluno.id, 100.0);

  let alunoProf = await alunoRepo.findOne({ where: { userId: aluno.id } });
  if (!alunoProf) {
    alunoProf = alunoRepo.create({
      userId: aluno.id,
      fullName: aluno.name,
      preferredModalities: ['Musculação', 'CrossFit', 'Funcional'],
    });
    await alunoRepo.save(alunoProf);
  }

  // 3. PERSONAL TRAINER (Diego Martins)
  const personal = await upsertUser({
    name: 'Diego Martins',
    email: 'personal@finex.net.br',
    role: 'PERSONAL',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    phone: '(55) 99999-0003',
    cityBase: 'Uruguaiana - RS',
    bio: 'Treinador especialista em biomecânica aplicada e hipertrofia muscular. Mais de 8 anos transformando rotinas com periodizações personalizadas.',
  });
  await ensureWallet(personal.id, 180.0);

  let personalProf = await personalRepo.findOne({ where: { userId: personal.id } });
  if (!personalProf) {
    personalProf = personalRepo.create({
      userId: personal.id,
      publicName: 'Diego Martins',
      cref: '012345-G/RS',
      professionTitle: 'Personal Trainer & Especialista em Hipertrofia',
      bio: 'Treinador especialista em biomecânica aplicada e hipertrofia muscular. Mais de 8 anos transformando rotinas com periodizações personalizadas.',
      methodology: 'Metodologia fundamentada na ciência do exercício e biomecânica aplicada. Periodização individualizada, garantindo segurança articular, progressão constante de cargas e resultados consistentes.',
      specialties: ['Hipertrofia Muscular', 'Biomecânica & Postura', 'Consultoria Online', 'Emagrecimento & Definição', 'Treinamento Funcional'],
      serviceLocations: ['Online / Remoto pelo App Finex', 'Academias Parceiras Credenciadas', 'Atendimento a Domicílio / Condomínio'],
      includedBenefits: [
        'Ficha de Treino Personalizada no App Finex',
        'Ajustes Semanais de Carga e Volume',
        'Suporte e Dúvidas pelo Chat do App Finex',
        'Vídeos demonstrativos de execução dos exercícios',
        'Avaliação física e análise postural',
      ],
      galleryUrls: [
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800',
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800',
        'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=800',
        'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=800',
      ],
      instagram: '@diegomartins_coach',
      whatsapp: '55999990003',
      serviceRadiusKm: 15,
      baseHourlyPrice: '75.00',
      qualityScore: 5.0,
      responseRate: 100,
    });
    await personalRepo.save(personalProf);
  }

  // Serviços Diego
  const personalServices = [
    {
      name: 'Periodização de Hipertrofia & Biomecânica',
      description: 'Acompanhamento mensal com periodização individual de treinos, controle de cargas e suporte pelo chat do app.',
      modality: 'Musculação & Hipertrofia',
      durationMinutes: 60,
      type: ServiceType.PLANO_MENSAL,
      price: '250.00',
      benefits: [
        'Ficha de Treino Personalizada no App Finex',
        'Ajustes Semanais de Volume e Carga',
        'Suporte e Dúvidas pelo Chat do App',
        'Vídeos demonstrativos de execução dos exercícios',
        'Avaliação física periódica',
      ],
      recurrence: 'MONTHLY',
      durationMonths: 1,
      maxInstallments: 1,
    },
    {
      name: 'Acompanhamento Trimestral de Hipertrofia (3 Meses)',
      description: 'Plano intensivo de 12 semanas com periodização contínua, ajustes de carga e suporte direto pelo chat. Opção de parcelamento em até 3x sem juros no cartão.',
      modality: 'Musculação & Hipertrofia',
      durationMinutes: 60,
      type: ServiceType.PLANO_MENSAL,
      price: '600.00',
      recurrence: 'QUARTERLY',
      durationMonths: 3,
      maxInstallments: 3,
      benefits: [
        'Acompanhamento Intensivo de 12 Semanas (3 Meses)',
        'Ficha de Treino com Periodização Completa no App',
        'Ajustes Semanais de Volume, Carga e Exercícios',
        'Suporte Contínuo com o Treinador pelo Chat',
        'Avaliações Físicas e Comparativo de Evolução',
        'Parcelamento em até 3x sem juros no cartão',
      ],
    },
    {
      name: 'Consultoria Online Anual VIP (12 Meses)',
      description: 'Transformação física ao longo de 1 ano completo. Periodizações mensais atualizadas no app Finex, avaliações físicas e suporte prioritário. Parcelamento em até 12x de R$ 100,00 sem juros.',
      modality: 'Consultoria Online',
      durationMinutes: 30,
      type: ServiceType.PLANO_MENSAL,
      price: '1200.00',
      recurrence: 'ANNUAL',
      durationMonths: 12,
      maxInstallments: 12,
      benefits: [
        'Acompanhamento Completo por 12 Meses (1 Ano)',
        'Periodizações Mensais Atualizadas no App Finex',
        'Suporte Prioritário pelo Chat do App',
        'Avaliações Físicas Trimestrais com Fotos e Métricas',
        'Vídeos Explicativos de Cada Exercício',
        'Parcelamento em até 12x de R$ 100,00 sem juros',
      ],
    },
    {
      name: 'Consultoria Online Premium',
      description: 'Acompanhamento à distância completo com planilha de treino periódica no app Finex e suporte contínuo.',
      modality: 'Consultoria Online',
      durationMinutes: 30,
      type: ServiceType.PLANO_MENSAL,
      price: '180.00',
      recurrence: 'MONTHLY',
      durationMonths: 1,
      maxInstallments: 1,
      benefits: [
        'Treino 100% no App Finex',
        'Ajustes quinzenais de rotina',
        'Chat direto com o treinador',
        'Vídeos explicativos de cada movimento',
      ],
    },
    {
      name: 'Treino Presencial Individual (60 min)',
      description: 'Sessão presencial individual com correção biomecânica em tempo real e motivação constante.',
      modality: 'Treinamento Individual',
      durationMinutes: 60,
      type: ServiceType.SESSAO,
      price: '75.00',
      maxInstallments: 1,
      benefits: ['Acompanhamento 1 a 1', 'Correção de execução imediata', 'Uso livre de equipamentos'],
    },
  ];

  for (const s of personalServices) {
    let existing = await servicesRepo.findOne({ where: { providerId: personal.id, name: s.name } });
    if (!existing) {
      existing = servicesRepo.create({
        providerId: personal.id,
        providerType: ProviderType.PERSONAL,
        name: s.name,
        description: s.description,
        modality: s.modality,
        durationMinutes: s.durationMinutes,
        type: s.type,
        price: s.price,
        benefits: s.benefits,
        recurrence: (s as any).recurrence || 'MONTHLY',
        durationMonths: (s as any).durationMonths || 1,
        maxInstallments: (s as any).maxInstallments || 1,
        isActive: true,
      });
      existing = await servicesRepo.save(existing);

      if (slotsRepo && s.type === ServiceType.SESSAO) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        for (const hour of [8, 10, 14, 16, 18]) {
          const slotStart = new Date(tomorrow);
          slotStart.setHours(hour, 0, 0, 0);
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + 60);

          const slot = slotsRepo.create({
            serviceId: existing.id,
            startsAt: slotStart,
            endsAt: slotEnd,
            status: ScheduleSlotStatus.AVAILABLE,
          });
          await slotsRepo.save(slot).catch(() => {});
        }
      }
    }
  }

  // 4. NUTRICIONISTA (Dra. Camila Alencar)
  const nutri = await upsertUser({
    name: 'Dra. Camila Alencar',
    email: 'nutri@finex.net.br',
    role: 'PERSONAL',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813580-c1165a6f2369?w=400',
    phone: '(55) 99999-0004',
    cityBase: 'Uruguaiana - RS',
    bio: 'Nutricionista clínica e esportiva (CRN-2 98765). Foco em emagrecimento saudável, hipertrofia e performance sem dietas restritivas insustentáveis.',
  });
  await ensureWallet(nutri.id, 240.0);

  let nutriProf = await personalRepo.findOne({ where: { userId: nutri.id } });
  if (!nutriProf) {
    nutriProf = personalRepo.create({
      userId: nutri.id,
      publicName: 'Dra. Camila Alencar',
      crn: 'CRN-2 98765',
      professionTitle: 'Nutricionista Esportiva & Performance',
      bio: 'Nutricionista clínica e esportiva (CRN-2 98765). Foco em emagrecimento saudável, hipertrofia e performance sem dietas restritivas insustentáveis.',
      methodology: 'Elaboração de planos alimentares 100% individualizados baseados na rotina, exames e preferências do paciente. Foco em equilíbrio de macronutrientes, sem dietas restritivas insustentáveis.',
      specialties: ['Nutrição Esportiva', 'Emagrecimento & Definição', 'Bioimpedância', 'Hipertrofia Muscular', 'Suplementação Avançada'],
      serviceLocations: ['Consultório Presencial em Uruguaiana', 'Consultoria Online pelo App Finex'],
      includedBenefits: [
        'Plano Alimentar Individualizado no App Finex',
        'Avaliação de Bioimpedância com Gráficos de Evolução',
        'Ajustes Semanais de Cardápio e Suplementação',
        'Suporte e Dúvidas pelo Chat do App Finex',
      ],
      galleryUrls: [
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800',
        'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800',
      ],
      instagram: '@camilanutri_finex',
      whatsapp: '55999990004',
      serviceRadiusKm: 10,
      baseHourlyPrice: '140.00',
      qualityScore: 5.0,
      responseRate: 100,
    });
    await personalRepo.save(nutriProf);
  }

  const nutriServices = [
    {
      name: 'Acompanhamento Nutricional Mensal Premium',
      description: 'Acompanhamento nutricional contínuo com cardápios dinâmicos, suporte pelo chat do app e reavaliações periódicas.',
      modality: 'Nutrição Esportiva',
      durationMinutes: 30,
      type: ServiceType.PLANO_MENSAL,
      price: '220.00',
      recurrence: 'MONTHLY',
      durationMonths: 1,
      maxInstallments: 1,
      benefits: [
        'Plano Alimentar 100% Individualizado',
        'Avaliação de Bioimpedância Mensal',
        'Ajustes Semanais de Cardápio e Suplementação',
        'Suporte e Dúvidas pelo Chat do App Finex',
      ],
    },
    {
      name: 'Programa Nutricional Trimestral (3 Meses de Acompanhamento)',
      description: 'Programa intensivo de 12 semanas para reeducação alimentar, emagrecimento sustentável e ganho de massa magra. Parcelamento em até 3x sem juros no cartão.',
      modality: 'Nutrição Esportiva',
      durationMinutes: 45,
      type: ServiceType.PLANO_MENSAL,
      price: '540.00',
      recurrence: 'QUARTERLY',
      durationMonths: 3,
      maxInstallments: 3,
      benefits: [
        'Acompanhamento Intensivo de 12 Semanas (3 Meses)',
        '3 Consultas de Bioimpedância Tetrapolar',
        'Cardápios Semanais Dinâmicos no App Finex',
        'Ajuste Periódico de Suplementação Estratégica',
        'Suporte Contínuo pelo Chat do App',
        'Parcelamento em até 3x sem juros no cartão',
      ],
    },
    {
      name: 'Consulta Nutricional + Bioimpedância',
      description: 'Avaliação da composição corporal por bioimpedância tetrapolar, plano alimentar individualizado e orientação de suplementação.',
      modality: 'Nutrição Clínica',
      durationMinutes: 60,
      type: ServiceType.SESSAO,
      price: '140.00',
      maxInstallments: 1,
      benefits: ['Bioimpedância completa', 'Cardápio personalizado', 'Guia de suplementação'],
    },
  ];

  for (const s of nutriServices) {
    let existing = await servicesRepo.findOne({ where: { providerId: nutri.id, name: s.name } });
    if (!existing) {
      existing = servicesRepo.create({
        providerId: nutri.id,
        providerType: ProviderType.PERSONAL,
        name: s.name,
        description: s.description,
        modality: s.modality,
        durationMinutes: s.durationMinutes,
        type: s.type,
        price: s.price,
        benefits: s.benefits,
        recurrence: (s as any).recurrence || 'MONTHLY',
        durationMonths: (s as any).durationMonths || 1,
        maxInstallments: (s as any).maxInstallments || 1,
        isActive: true,
      });
      await servicesRepo.save(existing);
    }
  }

  // 5. FISIOTERAPEUTA (Dr. Rodrigo Mendes)
  const fisio = await upsertUser({
    name: 'Dr. Rodrigo Mendes',
    email: 'fisio@finex.net.br',
    role: 'PERSONAL',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400',
    phone: '(55) 99999-0005',
    cityBase: 'Uruguaiana - RS',
    bio: 'Fisioterapeuta e Osteopata (CREFITO-5 54321-F). Especialista em reabilitação de lesões, liberação miofascial instrumental e alívio de dores na coluna.',
  });
  await ensureWallet(fisio.id, 200.0);

  let fisioProf = await personalRepo.findOne({ where: { userId: fisio.id } });
  if (!fisioProf) {
    fisioProf = personalRepo.create({
      userId: fisio.id,
      publicName: 'Dr. Rodrigo Mendes',
      professionTitle: 'Fisioterapeuta & Osteopatia Desportiva',
      bio: 'Fisioterapeuta e Osteopata (CREFITO-5 54321-F). Especialista em reabilitação de lesões, liberação miofascial instrumental e alívio de dores na coluna.',
      methodology: 'Diagnóstico biomecânico preciso e tratamento focado na causa raiz da dor ou lesão, combinando terapia manual, osteopatia e exercícios corretivos.',
      specialties: ['Fisioterapia Desportiva', 'Liberação Miofascial', 'Osteopatia', 'Reabilitação de Lesões', 'Coluna & Postura'],
      serviceLocations: ['Clínica Presencial em Uruguaiana', 'Atendimento em Academias Parceiras Cadastradas'],
      includedBenefits: [
        'Avaliação Biomecânica Postural Completa',
        'Protocolo de Exercícios Corretivos no App Finex',
        'Sessões Quinzenais de Liberação Miofascial',
        'Suporte Direto no Chat para Prevenção de Dores',
      ],
      galleryUrls: [
        'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=800',
      ],
      instagram: '@rodrigofisio_finex',
      whatsapp: '55999990005',
      serviceRadiusKm: 10,
      baseHourlyPrice: '135.00',
      qualityScore: 5.0,
      responseRate: 100,
    });
    await personalRepo.save(fisioProf);
  }

  const fisioServices = [
    {
      name: 'Protocolo de Reabilitação & Liberação Mensal',
      description: 'Programa contínuo de manutenção articular, prevenção de lesões e liberação miofascial semanal.',
      modality: 'Fisioterapia Desportiva',
      durationMinutes: 45,
      type: ServiceType.PLANO_MENSAL,
      price: '240.00',
      recurrence: 'MONTHLY',
      durationMonths: 1,
      maxInstallments: 1,
      benefits: [
        'Avaliação Postural e Biomecânica',
        'Liberação Miofascial Instrumental',
        'Protocolo de Fortalecimento no App',
        'Suporte Contínuo',
      ],
    },
    {
      name: 'Programa de Reabilitação Articular Trimestral (3 Meses)',
      description: 'Tratamento contínuo de 12 semanas para correção postural, eliminação definitiva de dores na coluna e fortalecimento. Parcelamento em até 3x sem juros no cartão.',
      modality: 'Fisioterapia Desportiva',
      durationMinutes: 50,
      type: ServiceType.PLANO_MENSAL,
      price: '630.00',
      recurrence: 'QUARTERLY',
      durationMonths: 3,
      maxInstallments: 3,
      benefits: [
        'Programa Intensivo de Reabilitação (3 Meses)',
        'Sessões Quinzenais de Terapia Manual e Liberação',
        'Protocolo de Exercícios Personalizado no App Finex',
        'Acompanhamento e Reavaliações Periódicas',
        'Suporte Direto no Chat com o Fisioterapeuta',
        'Parcelamento em até 3x sem juros no cartão',
      ],
    },
    {
      name: 'Sessão de Fisioterapia & Liberação Miofascial',
      description: 'Alívio imediato de dores musculares, liberação instrumental e recuperação biomecânica acelerada.',
      modality: 'Recovery & Liberação',
      durationMinutes: 50,
      type: ServiceType.SESSAO,
      price: '135.00',
      maxInstallments: 1,
      benefits: ['Terapia Manual', 'Ventosaterapia', 'Exercícios terapêuticos'],
    },
  ];

  for (const s of fisioServices) {
    let existing = await servicesRepo.findOne({ where: { providerId: fisio.id, name: s.name } });
    if (!existing) {
      existing = servicesRepo.create({
        providerId: fisio.id,
        providerType: ProviderType.PERSONAL,
        name: s.name,
        description: s.description,
        modality: s.modality,
        durationMinutes: s.durationMinutes,
        type: s.type,
        price: s.price,
        benefits: s.benefits,
        recurrence: (s as any).recurrence || 'MONTHLY',
        durationMonths: (s as any).durationMonths || 1,
        maxInstallments: (s as any).maxInstallments || 1,
        isActive: true,
      });
      await servicesRepo.save(existing);
    }
  }

  // 6. ACADEMIA PARCEIRA (Iron Peak Finex)
  const academia = await upsertUser({
    name: 'Academia Iron Peak Finex',
    email: 'academia@finex.net.br',
    role: 'ACADEMIA',
    avatarUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
    phone: '(55) 99999-0006',
    cityBase: 'Uruguaiana - RS',
    bio: 'A maior e mais moderna academia de musculação e alta performance de Uruguaiana. Catraca digital com QR Code pelo App Finex.',
  });
  await ensureWallet(academia.id, 450.0);

  let academiaProf = await academiaRepo.findOne({ where: { userId: academia.id } });
  if (!academiaProf) {
    academiaProf = academiaRepo.create({
      userId: academia.id,
      razaoSocial: 'Iron Peak Fitness Ltda',
      nomeFantasia: 'Academia Iron Peak Finex',
      cnpj: '12.345.678/0001-90',
      bio: 'A maior e mais moderna academia de musculação e alta performance de Uruguaiana. Catraca digital com QR Code pelo App Finex.',
      address: 'Rua Duque de Caxias, 1500 - Centro',
      city: 'Uruguaiana',
      state: 'RS',
      zipCode: '97500-000',
      phone: '(55) 3411-9999',
      whatsapp: '55999990006',
      dayPassPrice: 25.0,
      facilities: ['Musculação Completa', 'Área Cardio / Esteiras', 'Vestiários com Chuveiro', 'Armários com Chave', 'Estacionamento Próprio', 'Ar Condicionado'],
      modalities: ['Musculação', 'CrossFit', 'Funcional', 'Spinning'],
      coverUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200',
      qualityScore: 5.0,
      responseRate: 100,
    });
    await academiaRepo.save(academiaProf);
  }

  let dayPassService = await servicesRepo.findOne({
    where: { providerId: academia.id, type: ServiceType.DIARIA },
  });
  if (!dayPassService) {
    dayPassService = servicesRepo.create({
      providerId: academia.id,
      providerType: ProviderType.ACADEMIA,
      name: 'Day Pass Finex - Catraca Digital (Treino Avulso)',
      description: 'Acesso total durante 1 dia completo a todas as áreas da academia através da catraca digital com QR Code no App Finex.',
      modality: 'Musculação & Cardio',
      durationMinutes: 1440,
      type: ServiceType.DIARIA,
      price: '25.00',
      benefits: ['Acesso Livre por 1 Dia', 'Vestiários e Chuveiros', 'Armários', 'Todas as Máquinas'],
      isActive: true,
    });
    await servicesRepo.save(dayPassService);
  }

  if (planRepo) {
    const gymPlans = [
      {
        name: 'Plano Mensal Livre',
        description: 'Acesso total sem restrição de horário a todas as instalações da academia.',
        price: '140.00',
        durationDays: 30,
        modalities: ['Musculação', 'Cardio', 'Funcional'],
        benefits: ['Acesso Ilimitado', 'Catraca Digital QR Code', 'Avaliação Física Inclusa'],
      },
      {
        name: 'Plano Trimestral Gold',
        description: 'Plano de 3 meses com desconto especial para fidelidade e metas de médio prazo.',
        price: '380.00',
        durationDays: 90,
        modalities: ['Musculação', 'Cardio', 'Funcional', 'CrossFit'],
        benefits: ['Acesso Ilimitado', 'Catraca Digital QR Code', 'Avaliação Física Mensal', 'Desconto em Suplementos'],
      },
      {
        name: 'Plano Anual VIP',
        description: 'A melhor condição anual para quem treina o ano todo com máxima economia.',
        price: '1200.00',
        durationDays: 365,
        modalities: ['Musculação', 'Cardio', 'Funcional', 'CrossFit', 'Spinning'],
        benefits: ['Acesso Ilimitado 365 Dias', 'Kit Atleta Finex Grátis', 'Catraca Digital', 'Convite Mensal para 1 Amigo'],
      },
    ];

    for (const gp of gymPlans) {
      let existingPlan = await planRepo.findOne({
        where: { academiaId: academia.id, name: gp.name },
      });
      if (!existingPlan) {
        existingPlan = planRepo.create({
          academiaId: academia.id,
          name: gp.name,
          description: gp.description,
          price: gp.price,
          durationDays: gp.durationDays,
          modalities: gp.modalities,
          benefits: gp.benefits,
          isActive: true,
        });
        await planRepo.save(existingPlan);
      }
    }
  }

  if (catalogRepo) {
    const baseCatalogItems = [
      { name: 'Treino Personalizado de Musculação (Hipertrofia/Força)', modality: 'Musculação', durationMinutes: 60, type: ServiceType.SESSAO, description: 'Acompanhamento individual focado em hipertrofia, biomecânica dos exercícios e controle de cargas.' },
      { name: 'Avaliação Física Completa + Bioimpedância', modality: 'Musculação', durationMinutes: 45, type: ServiceType.SESSAO, description: 'Medição de dobras cutâneas, percentual de gordura, massa magra e teste de carga máxima.' },
      { name: 'Day Pass (Passe Diário) - Musculação & Vestiário', modality: 'Academia', durationMinutes: 1440, type: ServiceType.DIARIA, description: 'Acesso total durante 1 dia completo aos equipamentos de musculação, ergometria e infraestrutura.' },
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
  }
}
