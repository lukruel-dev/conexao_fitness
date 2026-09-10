import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In, Like, Not } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User } from './modules/users/entities/user.entity';
import { ServiceCatalog } from './modules/service-catalog/entities/service-catalog.entity';
import { Service as AppService, ServiceType } from './modules/services/entities/service.entity';
import { ScheduleSlot } from './modules/services/entities/schedule-slot.entity';
import { Post } from './modules/posts/entities/post.entity';
import { PostComment } from './modules/posts/entities/post-comment.entity';
import { PostLike } from './modules/posts/entities/post-like.entity';
import { UserFollow } from './modules/users/entities/user-follow.entity';
import { PersonalProfile } from './modules/users/entities/personal-profile.entity';
import { AlunoProfile } from './modules/users/entities/aluno-profile.entity';
import { AcademiaProfile } from './modules/users/entities/academia-profile.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const usersRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const catalogRepo = app.get<Repository<ServiceCatalog>>(getRepositoryToken(ServiceCatalog));
  const servicesRepo = app.get<Repository<AppService>>(getRepositoryToken(AppService));
  const slotsRepo = app.get<Repository<ScheduleSlot>>(getRepositoryToken(ScheduleSlot));
  const postsRepo = app.get<Repository<Post>>(getRepositoryToken(Post));
  const commentsRepo = app.get<Repository<PostComment>>(getRepositoryToken(PostComment));
  const likesRepo = app.get<Repository<PostLike>>(getRepositoryToken(PostLike));
  const followsRepo = app.get<Repository<UserFollow>>(getRepositoryToken(UserFollow));
  const personalRepo = app.get<Repository<PersonalProfile>>(getRepositoryToken(PersonalProfile));
  const alunoRepo = app.get<Repository<AlunoProfile>>(getRepositoryToken(AlunoProfile));
  const academiaRepo = app.get<Repository<AcademiaProfile>>(getRepositoryToken(AcademiaProfile));

  console.log('🚀 Iniciando Seeding Limpo (Apenas Admin & Catálogo Oficial)...');

  // 1. Limpeza de Bots e Contas Fictícias de Teste Anteriores
  const testBotEmails = [
    'aluno@conexaofitness.com.br',
    'personal@conexaofitness.com.br',
    'nutri@conexaofitness.com.br',
    'fisio@conexaofitness.com.br',
    'academia@conexaofitness.com.br',
  ];

  console.log('🧹 Verificando e removendo contas de bots/testes legadas...');
  const botUsers = await usersRepo.find({
    where: [
      { email: In(testBotEmails) },
    ],
  });

  if (botUsers.length > 0) {
    const botIds = botUsers.map((u) => u.id);
    console.log(`Encontrados ${botUsers.length} usuários bots legados para remoção.`);

    // 1.1 Remover interações e posts associados aos bots
    try {
      await followsRepo.delete({ followerId: In(botIds) });
      await followsRepo.delete({ followingId: In(botIds) });
      await likesRepo.delete({ userId: In(botIds) });
      await commentsRepo.delete({ authorId: In(botIds) });
      await postsRepo.delete({ authorId: In(botIds) });

      // 1.2 Remover serviços e slots associados
      const botServices = await servicesRepo.find({ where: { providerId: In(botIds) } });
      if (botServices.length > 0) {
        const serviceIds = botServices.map((s) => s.id);
        await slotsRepo.delete({ serviceId: In(serviceIds) });
        await servicesRepo.delete({ id: In(serviceIds) });
      }

      // 1.3 Remover perfis
      await personalRepo.delete({ userId: In(botIds) });
      await alunoRepo.delete({ userId: In(botIds) });
      await academiaRepo.delete({ userId: In(botIds) });

      // 1.4 Remover usuários bots
      await usersRepo.delete({ id: In(botIds) });
      console.log('✅ Contas bots e dados fictícios removidos com sucesso.');
    } catch (cleanErr) {
      console.warn('Nota na limpeza de bots:', cleanErr);
    }
  }

  // 2. Criar ou Garantir ADMIN Principal
  const adminEmail = 'admin@conexaofitness.com.br';
  const existingAdmin = await usersRepo.findOne({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('123456', 10);
    const admin = usersRepo.create({
      name: 'Administrador Conexão Fitness',
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
      status: 'ATIVO',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      phone: '(55) 99999-0000',
      cityBase: 'Uruguaiana - RS',
    });
    await usersRepo.save(admin);
    console.log(`✅ Administrador criado com sucesso: ${adminEmail}`);
  } else {
    console.log(`ℹ️ Administrador já existe no banco: ${adminEmail}`);
  }

  // 3. Populando o Catálogo Base de Serviços Oficiais (Modelos para os profissionais usarem)
  console.log('📚 Populando Catálogo Base Oficial de Serviços...');
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
  console.log(`✅ Catálogo Base com ${baseCatalogItems.length} opções disponíveis para profissionais reais.`);

  console.log('🎉 Seeding concluído com sucesso: Zero bots, 100% focado em usuários e profissionais reais!');
  await app.close();
}

bootstrap().catch((err) => {
  console.error('❌ Erro no seeding:', err);
  process.exit(1);
});
