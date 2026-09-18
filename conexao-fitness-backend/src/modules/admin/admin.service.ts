import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { Service, ServiceType, ProviderType } from '../services/entities/service.entity';
import { Subscription, SubscriptionStatus } from '../payments/entities/subscription.entity';
import { PersonalProfile } from '../users/entities/personal-profile.entity';
import { AlunoProfile } from '../users/entities/aluno-profile.entity';
import { AcademiaProfile } from '../users/entities/academia-profile.entity';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Booking)
    private readonly bookingsRepo: Repository<Booking>,
    @InjectRepository(Service)
    private readonly servicesRepo: Repository<Service>,
    @InjectRepository(Subscription)
    private readonly subscriptionsRepo: Repository<Subscription>,
    @InjectRepository(PersonalProfile)
    private readonly personalProfileRepo: Repository<PersonalProfile>,
    @InjectRepository(AlunoProfile)
    private readonly alunoProfileRepo: Repository<AlunoProfile>,
    @InjectRepository(AcademiaProfile)
    private readonly academiaProfileRepo: Repository<AcademiaProfile>,
    private readonly authService: AuthService,
  ) {}

  async approveKyc(userId: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    user.status = 'ATIVO';
    user.kycRejectionReason = null as any;
    return this.usersRepo.save(user);
  }

  async rejectKyc(userId: string, reason: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    user.status = 'KYC_REJEITADO'; 
    user.kycRejectionReason = reason;
    return this.usersRepo.save(user);
  }

  async bulkApproveKyc(userIds: string[]): Promise<{ success: boolean; count: number; message: string }> {
    if (!userIds || userIds.length === 0) {
      throw new BadRequestException('Nenhum usuário informado para aprovação.');
    }
    const users = await this.usersRepo.find({
      where: { id: In(userIds) },
    });
    if (users.length === 0) {
      return { success: true, count: 0, message: 'Nenhum usuário correspondente encontrado.' };
    }
    for (const u of users) {
      u.status = 'ATIVO';
      u.kycRejectionReason = null as any;
    }
    await this.usersRepo.save(users);
    return { success: true, count: users.length, message: `${users.length} usuário(s) aprovado(s) com sucesso.` };
  }

  async bulkSuspendUsers(userIds: string[], currentAdminId?: string): Promise<{ success: boolean; count: number; message: string }> {
    if (!userIds || userIds.length === 0) {
      throw new BadRequestException('Nenhum usuário informado para suspensão.');
    }
    const targetIds = currentAdminId ? userIds.filter(id => id !== currentAdminId) : userIds;
    if (targetIds.length === 0) {
      throw new BadRequestException('Não é possível suspender o próprio usuário administrador logado.');
    }
    const users = await this.usersRepo.find({
      where: { id: In(targetIds) },
    });
    for (const u of users) {
      u.status = 'SUSPENSO';
    }
    await this.usersRepo.save(users);
    return { success: true, count: users.length, message: `${users.length} usuário(s) suspenso(s) com sucesso.` };
  }

  async bulkActivateUsers(userIds: string[]): Promise<{ success: boolean; count: number; message: string }> {
    if (!userIds || userIds.length === 0) {
      throw new BadRequestException('Nenhum usuário informado para ativação.');
    }
    const users = await this.usersRepo.find({
      where: { id: In(userIds) },
    });
    for (const u of users) {
      u.status = 'ATIVO';
    }
    await this.usersRepo.save(users);
    return { success: true, count: users.length, message: `${users.length} usuário(s) reativado(s) com sucesso.` };
  }

  async getDashboardMetrics() {
    const totalUsers = await this.usersRepo.count();
    const activeSubscriptions = await this.subscriptionsRepo.count({ where: { status: SubscriptionStatus.ACTIVE } });
    const totalBookings = await this.bookingsRepo.count({ where: { status: BookingStatus.CONFIRMED } });
    const totalServices = await this.servicesRepo.count();

    return {
      totalUsers,
      activeSubscriptions,
      totalBookings,
      totalServices,
    };
  }

  async findAllUsers(role?: UserRole, status?: UserStatus): Promise<User[]> {
    const query = this.usersRepo.createQueryBuilder('user')
      .leftJoinAndSelect('user.personalProfile', 'personalProfile')
      .leftJoinAndSelect('user.academiaProfile', 'academiaProfile');
    
    if (role) {
      query.andWhere('user.role = :role', { role });
    }
    
    if (status) {
      query.andWhere('user.status = :status', { status });
    }

    return query.getMany();
  }

  async findAllBookings(status?: BookingStatus): Promise<Booking[]> {
    const query = this.bookingsRepo.createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.slot', 'slot')
      .leftJoinAndSelect('booking.student', 'student')
      .orderBy('booking.createdAt', 'DESC');

    if (status) {
      query.andWhere('booking.status = :status', { status });
    }

    return query.getMany();
  }

  async suspendUser(userId: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    user.status = 'SUSPENSO';
    return this.usersRepo.save(user);
  }

  async activateUser(userId: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    user.status = 'ATIVO';
    return this.usersRepo.save(user);
  }

  async deleteUser(userId: string, currentAdminId?: string): Promise<{ success: boolean; message: string }> {
    if (currentAdminId && userId === currentAdminId) {
      throw new BadRequestException('Não é possível excluir o próprio usuário administrador logado.');
    }
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const entityManager = this.usersRepo.manager;

    await entityManager.transaction(async (manager) => {
      // 1. Limpa avaliações (como aluno ou como prestador)
      await manager.query(`DELETE FROM "reviews" WHERE "studentId" = $1 OR "providerId" = $1`, [userId]).catch(() => {});

      // 2. Limpa mensagens do chat enviadas pelo usuário
      await manager.query(`DELETE FROM "messages" WHERE "senderId" = $1`, [userId]).catch(() => {});

      // 3. Limpa disponibilidades cadastradas do profissional
      await manager.query(`DELETE FROM "provider_availabilities" WHERE "providerId" = $1`, [userId]).catch(() => {});

      // 4. Limpa assinaturas ativas/pendentes
      await manager.query(`DELETE FROM "subscriptions" WHERE "userId" = $1`, [userId]).catch(() => {});

      // 5. Limpa notificações do usuário
      await manager.query(`DELETE FROM "notifications" WHERE "userId" = $1`, [userId]).catch(() => {});

      // 6. Limpa dados financeiros (carteira, intents de pagamento)
      await manager.query(`DELETE FROM "payment_intents" WHERE "payerUserId" = $1`, [userId]).catch(() => {});
      await manager.query(`DELETE FROM "wallet_accounts" WHERE "owner_id" = $1`, [userId]).catch(() => {});

      // 7. Remove serviços prestados pelo usuário (o TypeORM faz cascade em schedule_slots e bookings)
      const userServices = await manager.find(Service, { where: { providerId: userId } });
      for (const service of userServices) {
        await manager.delete(Service, service.id);
      }

      // 8. Remove agendamentos feitos pelo usuário como aluno
      await manager.delete(Booking, { student: { id: userId } });

      // 9. Remove perfis
      await manager.query(`DELETE FROM "personal_profiles" WHERE "user_id" = $1`, [userId]).catch(() => {});
      await manager.query(`DELETE FROM "academia_profiles" WHERE "user_id" = $1`, [userId]).catch(() => {});
      await manager.query(`DELETE FROM "aluno_profiles" WHERE "user_id" = $1`, [userId]).catch(() => {});

      // 10. Remove o usuário principal
      await manager.delete(User, userId);
    });

    return { success: true, message: 'Usuário excluído com sucesso' };
  }

  async bulkDeleteUsers(userIds: string[], currentAdminId?: string): Promise<{ success: boolean; count: number; message: string }> {
    if (!userIds || userIds.length === 0) {
      throw new BadRequestException('Nenhum usuário informado para exclusão.');
    }
    const targetIds = currentAdminId ? userIds.filter(id => id !== currentAdminId) : userIds;
    if (targetIds.length === 0) {
      throw new BadRequestException('Não é possível excluir o próprio usuário administrador logado.');
    }

    let deletedCount = 0;
    for (const id of targetIds) {
      try {
        await this.deleteUser(id, currentAdminId);
        deletedCount++;
      } catch (err) {
        // Segue para os demais usuários se algum falhar ou já tiver sido excluído
      }
    }

    return {
      success: true,
      count: deletedCount,
      message: `${deletedCount} usuário(s) excluído(s) com sucesso.`,
    };
  }

  async findAllSubscriptions(): Promise<Subscription[]> {
    return this.subscriptionsRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async impersonate(targetRole: string): Promise<{ accessToken: string; user: any }> {
    const roleKey = (targetRole || '').toUpperCase();
    let targetEmail: string;

    if (roleKey === 'PERSONAL') {
      targetEmail = 'personal.demo@conexao.com';
    } else if (roleKey === 'NUTRICIONISTA' || roleKey === 'NUTRI') {
      targetEmail = 'nutri.demo@conexao.com';
    } else if (roleKey === 'ACADEMIA') {
      targetEmail = 'academia.demo@conexao.com';
    } else if (roleKey === 'STUDENT' || roleKey === 'ALUNO') {
      targetEmail = 'aluno.demo@conexao.com';
    } else {
      throw new BadRequestException(`Perfil de teste inválido: ${targetRole}`);
    }

    const defaultPassword = 'password123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    let user = await this.usersRepo.findOne({
      where: { email: targetEmail },
      relations: ['personalProfile', 'alunoProfile', 'academiaProfile'],
    });

    if (!user) {
      if (roleKey === 'PERSONAL') {
        user = this.usersRepo.create({
          email: targetEmail,
          name: 'Lucas Silva (Personal Trainer)',
          passwordHash,
          role: 'PERSONAL',
          status: 'ATIVO',
          cityBase: 'São Paulo - SP',
          phone: '(11) 98111-2233',
          avatarUrl: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=300&auto=format&fit=crop&q=80',
          bio: 'Educador Físico (CREF 045812-G/SP). Pós-graduado em Biomecânica e Fisiologia do Exercício. Especialista em hipertrofia avançada, periodização de força e emagrecimento saudável.',
        });
        await this.usersRepo.save(user);

        const profile = this.personalProfileRepo.create({
          userId: user.id,
          publicName: 'Lucas Silva Personal',
          cref: '045812-G/SP',
          professionTitle: 'Personal Trainer & Especialista em Hipertrofia',
          bio: user.bio,
          modalities: ['Musculação', 'Treinamento Funcional', 'Hipertrofia'],
          specialties: ['Hipertrofia Muscular', 'Biomecânica & Postura', 'Periodização de Força', 'Consultoria Online'],
          methodology: 'Metodologia baseada em evidências científicas, controle de sobrecarga progressiva, biomecânica articular e acompanhamento de cargas semanais via app Finex.',
          serviceLocations: ['Online / Remoto pelo App Finex', 'Academias Parceiras Cadastradas', 'Consultório / Estúdio Próprio'],
          includedBenefits: ['Ficha de Treino Personalizada no App Finex', 'Ajustes Semanais de Volume e Carga', 'Suporte e Dúvidas pelo Chat do App Finex', 'Vídeos demonstrativos de execução dos exercícios'],
          baseHourlyPrice: '150.00',
        });
        await this.personalProfileRepo.save(profile);
        user.personalProfile = profile;

        // Cria serviços de exemplo
        const s1 = this.servicesRepo.create({
          providerId: user.id,
          providerType: ProviderType.PERSONAL,
          name: 'Consultoria Premium & Personal VIP (Musculação)',
          description: 'Acompanhamento individual focado em hipertrofia, biomecânica dos exercícios e controle de cargas.',
          type: ServiceType.SESSAO,
          price: '150.00',
          durationMinutes: 60,
          modality: 'Musculação',
          isActive: true,
        });
        const s2 = this.servicesRepo.create({
          providerId: user.id,
          providerType: ProviderType.PERSONAL,
          name: 'Periodização de Hipertrofia & Biomecânica',
          description: 'Planejamento mensal com divisão A/B/C/D, progressão de sobrecarga e ajustes periódicos.',
          type: ServiceType.PLANO_MENSAL,
          recurrence: 'MONTHLY',
          price: '250.00',
          durationMinutes: 60,
          modality: 'Musculação',
          isActive: true,
        });
        const s3 = this.servicesRepo.create({
          providerId: user.id,
          providerType: ProviderType.PERSONAL,
          name: 'Avaliação Física Completa & Correção Postural',
          description: 'Medição de dobras cutâneas, bioimpedância, análise de encurtamentos e teste de 1RM.',
          type: ServiceType.SESSAO,
          price: '120.00',
          durationMinutes: 45,
          modality: 'Musculação',
          isActive: true,
        });
        await this.servicesRepo.save([s1, s2, s3]);
      } else if (roleKey === 'NUTRICIONISTA' || roleKey === 'NUTRI') {
        user = this.usersRepo.create({
          email: targetEmail,
          name: 'Dra. Camila Santos (Nutricionista)',
          passwordHash,
          role: 'PERSONAL',
          status: 'ATIVO',
          cityBase: 'São Paulo - SP',
          phone: '(11) 97222-4455',
          avatarUrl: 'https://images.unsplash.com/photo-1594824813689-ff82544cb44a?w=300&auto=format&fit=crop&q=80',
          bio: 'Nutricionista Esportiva (CRN-3 48190-D). Pós-graduada em Nutrição Clínica e Esportiva de Alta Performance. Prescrição de planos alimentares individualizados, cálculo de macronutrientes e bioimpedância.',
        });
        await this.usersRepo.save(user);

        const profile = this.personalProfileRepo.create({
          userId: user.id,
          publicName: 'Dra. Camila Santos Nutricionista',
          crn: 'CRN-3 48190-D',
          cref: null as any,
          professionTitle: 'Nutricionista Esportiva & Clínica Funcional',
          bio: user.bio,
          modalities: ['Nutrição Esportiva', 'Nutrição Clínica', 'Emagrecimento & Definição'],
          specialties: ['Nutrição Esportiva', 'Emagrecimento & Definição', 'Cálculo de Macronutrientes', 'Avaliação por Bioimpedância', 'Acompanhamento Mensal'],
          methodology: 'Abordagem humanizada e baseada em bioindividualidade. Cálculo preciso de macronutrientes (proteínas, carboidratos e lipídios), periodização nutricional sincronizada com o treino e cardápios práticos e prazerosos.',
          serviceLocations: ['Online / Remoto pelo App Finex', 'Consultório / Estúdio Próprio'],
          includedBenefits: ['Plano Alimentar Individualizado no App', 'Cálculo e Ajuste Semanal de Macronutrientes', 'Lista de Compras Inteligente', 'Suporte Contínuo para Dúvidas pelo Chat', 'Avaliação de Composição Corporal'],
          baseHourlyPrice: '180.00',
        });
        await this.personalProfileRepo.save(profile);
        user.personalProfile = profile;

        // Cria serviços de exemplo para a nutricionista
        const s1 = this.servicesRepo.create({
          providerId: user.id,
          providerType: ProviderType.PERSONAL,
          name: 'Consulta Nutricional Esportiva + Plano Alimentar Individualizado',
          description: 'Anamnese completa, cálculo de taxa metabólica basal, distribuição de macronutrientes e cardápio flexível.',
          type: ServiceType.SESSAO,
          price: '180.00',
          durationMinutes: 60,
          modality: 'Nutrição',
          isActive: true,
        });
        const s2 = this.servicesRepo.create({
          providerId: user.id,
          providerType: ProviderType.PERSONAL,
          name: 'Acompanhamento Nutricional Mensal (Revisão & Ajuste de Macros)',
          description: 'Retornos quinzenais, acompanhamento da evolução da composição corporal e adaptações na dieta.',
          type: ServiceType.PLANO_MENSAL,
          recurrence: 'MONTHLY',
          price: '260.00',
          durationMinutes: 45,
          modality: 'Nutrição',
          isActive: true,
        });
        const s3 = this.servicesRepo.create({
          providerId: user.id,
          providerType: ProviderType.PERSONAL,
          name: 'Avaliação Nutricional por Bioimpedância Tetrapolar',
          description: 'Análise de percentual de gordura, massa muscular esquelética, taxa de hidratação e gordura visceral.',
          type: ServiceType.SESSAO,
          price: '90.00',
          durationMinutes: 30,
          modality: 'Nutrição',
          isActive: true,
        });
        await this.servicesRepo.save([s1, s2, s3]);
      } else if (roleKey === 'ACADEMIA') {
        user = this.usersRepo.create({
          email: targetEmail,
          name: 'Academia Conexão Fitness Prime',
          passwordHash,
          role: 'ACADEMIA',
          status: 'ATIVO',
          cityBase: 'São Paulo - SP',
          phone: '(11) 3456-7890',
          avatarUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&auto=format&fit=crop&q=80',
          bio: 'Academia completa de alta performance com musculação pesada, área funcional, spinning e catraca digital inteligente com leitor óptico QR Code.',
        });
        await this.usersRepo.save(user);

        const profile = this.academiaProfileRepo.create({
          userId: user.id,
          nomeFantasia: 'Academia Conexão Fitness Prime',
          cnpj: '12.345.678/0001-90',
          address: 'Av. Paulista, 1500 - Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          modalities: ['Musculação', 'Spinning', 'Funcional', 'Luta'],
        });
        await this.academiaProfileRepo.save(profile);
        user.academiaProfile = profile;

        const s1 = this.servicesRepo.create({
          providerId: user.id,
          providerType: ProviderType.ACADEMIA,
          name: 'Day Pass (Passe Diário) - Musculação & Vestiário',
          description: 'Acesso total durante 1 dia completo aos equipamentos de musculação, ergometria e infraestrutura.',
          type: ServiceType.DIARIA,
          price: '25.00',
          durationMinutes: 1440,
          modality: 'Academia',
          isActive: true,
        });
        const s2 = this.servicesRepo.create({
          providerId: user.id,
          providerType: ProviderType.ACADEMIA,
          name: 'Plano Mensal Conexão VIP (Acesso Livre)',
          description: 'Acesso ilimitado a todas as áreas de musculação, funcional e aulas coletivas.',
          type: ServiceType.PLANO_MENSAL,
          recurrence: 'MONTHLY',
          price: '119.90',
          durationMinutes: 43200,
          modality: 'Academia',
          isActive: true,
        });
        await this.servicesRepo.save([s1, s2]);
      } else if (roleKey === 'STUDENT' || roleKey === 'ALUNO') {
        user = this.usersRepo.create({
          email: targetEmail,
          name: 'Gabriel Souza (Aluno Demo)',
          passwordHash,
          role: 'STUDENT',
          status: 'ATIVO',
          cityBase: 'São Paulo - SP',
          phone: '(11) 99333-5566',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
          bio: 'Aluno focado em hipertrofia e consistência. Aluno ativo da Academia Conexão Fitness Prime, treina sob supervisão do Personal Lucas Silva e segue a dieta da Dra. Camila Santos.',
        });
        await this.usersRepo.save(user);

        const profile = this.alunoProfileRepo.create({
          userId: user.id,
          fullName: user.name,
          preferredModalities: ['Musculação', 'Hipertrofia'],
        });
        await this.alunoProfileRepo.save(profile);
        user.alunoProfile = profile;
      }
    } else {
      user.status = 'ATIVO';
      if (roleKey === 'PERSONAL' && user.personalProfile) {
        user.personalProfile.cref = '045812-G/SP';
        user.personalProfile.professionTitle = 'Personal Trainer & Especialista em Hipertrofia';
        await this.personalProfileRepo.save(user.personalProfile);
      } else if ((roleKey === 'NUTRICIONISTA' || roleKey === 'NUTRI') && user.personalProfile) {
        user.personalProfile.crn = 'CRN-3 48190-D';
        user.personalProfile.professionTitle = 'Nutricionista Esportiva & Clínica Funcional';
        await this.personalProfileRepo.save(user.personalProfile);
      }
      await this.usersRepo.save(user);
    }

    return this.authService.login(user);
  }
}

