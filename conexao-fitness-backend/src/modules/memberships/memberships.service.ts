import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { MembershipPlan } from './entities/membership-plan.entity';
import {
  EnrollmentPaymentMethod,
  EnrollmentPaymentStatus,
  EnrollmentStatus,
  GymEnrollment,
} from './entities/gym-enrollment.entity';
import { AccessStatus, GymAccessLog } from './entities/gym-access-log.entity';
import { User } from '../users/entities/user.entity';
import { Subscription, SubscriptionStatus } from '../payments/entities/subscription.entity';
import { Service, ServiceType } from '../services/entities/service.entity';
import { CreateMembershipPlanDto } from './dto/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from './dto/update-membership-plan.dto';
import { EnrollOnlineDto } from './dto/enroll-online.dto';
import { ManualEnrollmentDto } from './dto/manual-enrollment.dto';
import { ValidateAccessDto } from './dto/validate-access.dto';
import { RenewEnrollmentDto } from './dto/renew-enrollment.dto';
import { FilterEnrollmentsDto } from './dto/filter-enrollments.dto';
import { ChargeDayPassDto } from './dto/charge-daypass.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class MembershipsService {
  private readonly logger = new Logger(MembershipsService.name);

  constructor(
    @InjectRepository(MembershipPlan)
    private readonly planRepo: Repository<MembershipPlan>,
    @InjectRepository(GymEnrollment)
    private readonly enrollmentRepo: Repository<GymEnrollment>,
    @InjectRepository(GymAccessLog)
    private readonly accessLogRepo: Repository<GymAccessLog>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    private readonly notificationsService: NotificationsService,
    private readonly walletService: WalletService,
  ) {}

  // =========================================================================
  // 1. VERIFICAÇÃO DE GATING DE PLANO (A PARTIR DO PLANO ESSENCIAL)
  // =========================================================================

  /**
   * Verifica se a academia possui assinatura ativa no Plano Essencial ou superior.
   * Planos elegíveis: Essencial, Destaque, Elite (ou qualquer plano pago ativo).
   */
  async checkGymPlanTier(academiaId: string): Promise<{ hasAccess: boolean; planName: string }> {
    const activeSub = await this.subscriptionRepo.findOne({
      where: { userId: academiaId, status: SubscriptionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });

    const planName = activeSub?.planName || 'Gratuito';
    const normalized = planName.toLowerCase();

    // Se o plano for Essencial, Destaque, Elite, Pro ou Premium, libera o acesso
    const isEligible =
      normalized.includes('essencial') ||
      normalized.includes('destaque') ||
      normalized.includes('elite') ||
      normalized.includes('pro') ||
      normalized.includes('premium') ||
      (activeSub && activeSub.status === SubscriptionStatus.ACTIVE && !normalized.includes('gratuito'));

    return {
      hasAccess: Boolean(isEligible),
      planName,
    };
  }

  /**
   * Garante que a academia possui acesso ao módulo de matrículas e catraca digital.
   */
  async assertGymPlanAccess(academiaId: string): Promise<void> {
    const { hasAccess, planName } = await this.checkGymPlanTier(academiaId);
    if (!hasAccess) {
      throw new ForbiddenException(
        `O sistema de gerenciamento de matrículas e catraca digital por QR Code está disponível a partir do Plano Essencial da academia (Plano atual: ${planName}). Faça upgrade para liberar.`,
      );
    }
  }

  // =========================================================================
  // 2. GESTÃO DE PLANOS DE MATRÍCULA DA ACADEMIA
  // =========================================================================

  async createPlan(academiaId: string, dto: CreateMembershipPlanDto): Promise<MembershipPlan> {
    await this.assertGymPlanAccess(academiaId);

    const plan = this.planRepo.create({
      academiaId,
      name: dto.name,
      description: dto.description,
      price: dto.price.toFixed(2),
      durationDays: dto.durationDays,
      recurrence: dto.recurrence,
      modalities: dto.modalities || [],
      benefits: dto.benefits || [],
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return this.planRepo.save(plan);
  }

  async updatePlan(
    academiaId: string,
    planId: string,
    dto: UpdateMembershipPlanDto,
  ): Promise<MembershipPlan> {
    await this.assertGymPlanAccess(academiaId);

    const plan = await this.planRepo.findOne({ where: { id: planId, academiaId } });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado ou não pertence a esta academia.');
    }

    if (dto.name !== undefined) plan.name = dto.name;
    if (dto.description !== undefined) plan.description = dto.description;
    if (dto.price !== undefined) plan.price = dto.price.toFixed(2);
    if (dto.durationDays !== undefined) plan.durationDays = dto.durationDays;
    if (dto.recurrence !== undefined) plan.recurrence = dto.recurrence;
    if (dto.modalities !== undefined) plan.modalities = dto.modalities;
    if (dto.benefits !== undefined) plan.benefits = dto.benefits;
    if (dto.isActive !== undefined) plan.isActive = dto.isActive;

    return this.planRepo.save(plan);
  }

  async deletePlan(academiaId: string, planId: string): Promise<{ success: boolean }> {
    await this.assertGymPlanAccess(academiaId);

    const plan = await this.planRepo.findOne({ where: { id: planId, academiaId } });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado.');
    }

    // Desativa para não quebrar histórico de matrículas existentes
    plan.isActive = false;
    await this.planRepo.save(plan);

    return { success: true };
  }

  async getMyPlans(academiaId: string): Promise<MembershipPlan[]> {
    return this.planRepo.find({
      where: { academiaId },
      order: { createdAt: 'ASC' },
    });
  }

  async getPublicPlansByAcademia(academiaId: string): Promise<MembershipPlan[]> {
    return this.planRepo.find({
      where: { academiaId, isActive: true },
      order: { price: 'ASC' },
    });
  }

  // =========================================================================
  // 3. MATRÍCULA ONLINE (ALUNO) E MATRÍCULA MANUAL (BALCÃO)
  // =========================================================================

  private generateQrAccessCode(): string {
    const token = randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase();
    return `CF-ACAD-${token}`;
  }

  async enrollOnline(
    studentId: string,
    academiaId: string,
    dto: EnrollOnlineDto,
  ): Promise<GymEnrollment> {
    const student = await this.userRepo.findOneBy({ id: studentId });
    if (!student) throw new NotFoundException('Aluno não encontrado.');

    const academia = await this.userRepo.findOne({
      where: { id: academiaId },
      relations: ['academiaProfile'],
    });
    if (!academia) throw new NotFoundException('Academia não encontrada.');

    // Validar se a academia tem o plano essencial ativo
    await this.assertGymPlanAccess(academiaId);

    const plan = await this.planRepo.findOne({
      where: { id: dto.planId, academiaId, isActive: true },
    });
    if (!plan) {
      throw new BadRequestException('Plano de matrícula inválido ou inativo.');
    }

    const priceNum = Number(plan.price);
    const paymentMethod = dto.paymentMethod || EnrollmentPaymentMethod.STRIPE;

    // Se o pagamento for via carteira, debita o saldo do aluno e credita a academia
    if (paymentMethod === EnrollmentPaymentMethod.WALLET) {
      const balance = await this.walletService.getMyBalance(studentId);
      if (balance.current_balance < priceNum) {
        throw new BadRequestException(
          `Saldo insuficiente na carteira (Disponível: R$ ${balance.current_balance.toFixed(2)} - Necessário: R$ ${priceNum.toFixed(2)})`,
        );
      }
      await this.walletService.deductBalance(studentId, priceNum);
      const gymFee = Number((priceNum * 0.05).toFixed(2)); // taxa reduzida para matrículas
      const gymNet = Number((priceNum - gymFee).toFixed(2));
      await this.walletService.addBalance(academiaId, gymNet);

      await this.walletService.recordTransaction({
        userId: academiaId,
        type: 'ENROLLMENT',
        amount: priceNum,
        fee: gymFee,
        description: `Matrícula: Plano ${plan.name}`,
        sourceUserId: student.id,
        sourceUserName: student.name,
        sourceUserAvatar: student.avatarUrl,
        targetUserId: academiaId,
        referenceType: 'ENROLLMENT',
        paymentMethod: 'FINEX_WALLET',
      });

      await this.walletService.recordTransaction({
        userId: studentId,
        type: 'DEBIT',
        amount: priceNum,
        description: `Matrícula: ${plan.name} (${academia.name})`,
        sourceUserId: student.id,
        targetUserId: academiaId,
        referenceType: 'ENROLLMENT',
        paymentMethod: 'FINEX_WALLET',
      });
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    const qrAccessCode = this.generateQrAccessCode();

    const enrollment = this.enrollmentRepo.create({
      studentId,
      academiaId,
      planId: plan.id,
      planName: plan.name,
      amountPaid: plan.price,
      paymentMethod,
      paymentStatus: EnrollmentPaymentStatus.PAID,
      status: EnrollmentStatus.ACTIVE,
      startDate: now,
      endDate,
      qrAccessCode,
    });

    const saved = await this.enrollmentRepo.save(enrollment);

    // Notificar o aluno
    await this.notificationsService.createNotification({
      userId: studentId,
      type: 'BOOKING_CONFIRMED',
      title: 'Matrícula confirmada!',
      content: `Sua matrícula no plano "${plan.name}" na academia ${academia.name} foi realizada com sucesso. Seu QR Code de acesso já está ativo no app!`,
      referenceId: saved.id,
    });

    // Notificar a academia
    await this.notificationsService.createNotification({
      userId: academiaId,
      type: 'NEW_BOOKING',
      title: 'Nova matrícula online recebida!',
      content: `O aluno ${student.name} acabou de se matricular no plano "${plan.name}".`,
      referenceId: saved.id,
    });

    this.logger.log(
      `Matrícula online criada: Aluno ${studentId} -> Academia ${academiaId} (${plan.name})`,
    );

    return saved;
  }

  async createManualEnrollment(
    academiaId: string,
    dto: ManualEnrollmentDto,
  ): Promise<GymEnrollment> {
    await this.assertGymPlanAccess(academiaId);

    let student: User | null = null;
    if (dto.studentId) {
      student = await this.userRepo.findOneBy({ id: dto.studentId });
    } else if (dto.studentEmail) {
      student = await this.userRepo.findOneBy({ email: dto.studentEmail.toLowerCase().trim() });
    }

    // Se o aluno não existir no Conexão Fitness, cria um registro rápido com senha padrão
    if (!student) {
      const tempEmail = dto.studentEmail
        ? dto.studentEmail.toLowerCase().trim()
        : `aluno.${randomUUID().substring(0, 8)}@conexaofitness.temp`;

      student = this.userRepo.create({
        name: dto.studentName,
        email: tempEmail,
        cpf: dto.studentCpf,
        role: 'STUDENT',
        status: 'ATIVO',
        passwordHash: '$2a$10$TempPasswordHashConexaoFitnessPass1234567890123456789012',
      });
      student = await this.userRepo.save(student);
    }

    const now = new Date();
    const duration = dto.durationDays || 30;
    const endDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
    const qrAccessCode = this.generateQrAccessCode();

    const enrollment = this.enrollmentRepo.create({
      studentId: student.id,
      academiaId,
      planId: dto.planId || undefined,
      planName: dto.planName,
      amountPaid: dto.amountPaid.toFixed(2),
      paymentMethod: dto.paymentMethod || EnrollmentPaymentMethod.MANUAL,
      paymentStatus: EnrollmentPaymentStatus.PAID,
      status: EnrollmentStatus.ACTIVE,
      startDate: now,
      endDate,
      qrAccessCode,
      notes: dto.notes,
    });

    const saved = await this.enrollmentRepo.save(enrollment);

    this.logger.log(
      `Matrícula manual no balcão: Aluno ${student.name} -> Academia ${academiaId} (${dto.planName})`,
    );

    return saved;
  }

  // =========================================================================
  // 4. LISTAGEM E GERENCIAMENTO DE MATRÍCULAS DA ACADEMIA
  // =========================================================================

  async listMyEnrollments(
    academiaId: string,
    filters: FilterEnrollmentsDto,
  ): Promise<{
    items: (GymEnrollment & { isExpiringSoon: boolean; daysRemaining: number })[];
    total: number;
    tier: { hasAccess: boolean; planName: string };
  }> {
    const tier = await this.checkGymPlanTier(academiaId);

    const qb = this.enrollmentRepo
      .createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .leftJoinAndSelect('enrollment.plan', 'plan')
      .where('enrollment.academiaId = :academiaId', { academiaId })
      .orderBy('enrollment.createdAt', 'DESC');

    if (filters.status) {
      qb.andWhere('enrollment.status = :status', { status: filters.status });
    }

    if (filters.search) {
      const search = `%${filters.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(student.name) LIKE :search OR LOWER(student.email) LIKE :search OR student.cpf LIKE :search OR LOWER(enrollment.qrAccessCode) LIKE :search OR LOWER(enrollment.planName) LIKE :search)',
        { search },
      );
    }

    const [rawItems, total] = await qb.getManyAndCount();
    const now = new Date();

    const items = rawItems.map((e) => {
      const end = new Date(e.endDate);
      const diffMs = end.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0 && e.status === EnrollmentStatus.ACTIVE;

      // Se passou da data final e ainda constava como ACTIVE, atualiza dinamicamente
      if (diffMs <= 0 && e.status === EnrollmentStatus.ACTIVE) {
        e.status = EnrollmentStatus.EXPIRED;
        this.enrollmentRepo.update(e.id, { status: EnrollmentStatus.EXPIRED });
      }

      return {
        ...e,
        isExpiringSoon,
        daysRemaining,
      };
    });

    return { items, total, tier };
  }

  async renewEnrollment(
    academiaId: string,
    enrollmentId: string,
    dto: RenewEnrollmentDto,
  ): Promise<GymEnrollment> {
    await this.assertGymPlanAccess(academiaId);

    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: enrollmentId, academiaId },
      relations: ['student'],
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula não encontrada.');
    }

    const additionalDays = dto.additionalDays || 30;
    const now = new Date();

    // Se já estiver expirada, a nova data base é a partir de agora
    const baseDate =
      new Date(enrollment.endDate).getTime() > now.getTime()
        ? new Date(enrollment.endDate)
        : now;

    enrollment.endDate = new Date(baseDate.getTime() + additionalDays * 24 * 60 * 60 * 1000);
    enrollment.status = EnrollmentStatus.ACTIVE;
    if (dto.amountPaid !== undefined) {
      enrollment.amountPaid = dto.amountPaid.toFixed(2);
    }
    if (dto.paymentMethod) {
      enrollment.paymentMethod = dto.paymentMethod;
    }

    const saved = await this.enrollmentRepo.save(enrollment);

    if (enrollment.studentId) {
      await this.notificationsService.createNotification({
        userId: enrollment.studentId,
        type: 'SYSTEM',
        title: 'Matrícula Renovada!',
        content: `Sua matrícula na academia foi renovada com sucesso! Válida até ${enrollment.endDate.toLocaleDateString('pt-BR')}.`,
        referenceId: saved.id,
      });
    }

    this.logger.log(`Matrícula renovada: ID ${enrollmentId} (+${additionalDays} dias)`);

    return saved;
  }

  async updateEnrollmentStatus(
    academiaId: string,
    enrollmentId: string,
    status: EnrollmentStatus,
    notes?: string,
  ): Promise<GymEnrollment> {
    await this.assertGymPlanAccess(academiaId);

    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: enrollmentId, academiaId },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula não encontrada.');
    }

    enrollment.status = status;
    if (notes !== undefined) enrollment.notes = notes;

    return this.enrollmentRepo.save(enrollment);
  }

  // =========================================================================
  // 5. CATRACA DIGITAL, VALIDAÇÃO DE ACESSO & DAY PASS INSTANTÂNEO NA CARTEIRA
  // =========================================================================

  /**
   * Obtém o valor configurado do Day Pass da academia
   */
  async getDayPassPrice(academiaId: string): Promise<number> {
    const gymUser = await this.userRepo.findOne({
      where: { id: academiaId },
      relations: ['academiaProfile'],
    });

    if (gymUser?.academiaProfile?.dayPassPrice && Number(gymUser.academiaProfile.dayPassPrice) > 0) {
      return Number(gymUser.academiaProfile.dayPassPrice);
    }

    const dayPassService = await this.serviceRepo.findOne({
      where: [
        { providerId: academiaId, type: ServiceType.DAY_PASS, isActive: true },
        { providerId: academiaId, type: ServiceType.DIARIA, isActive: true },
      ],
      order: { price: 'ASC' },
    });

    if (dayPassService && Number(dayPassService.price) > 0) {
      return Number(dayPassService.price);
    }

    return 25.0; // Valor padrão de Day Pass caso a academia não tenha configurado
  }

  /**
   * Cobrança de Day Pass Avulso debitada instantaneamente da carteira do aluno
   */
  async chargeDayPass(
    academiaId: string,
    dto: ChargeDayPassDto,
  ): Promise<{
    granted: boolean;
    isDayPass: boolean;
    reason?: string;
    amountDebited?: number;
    requiredAmount?: number;
    currentBalance?: number;
    newBalance?: number;
    student?: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string;
      cpf?: string;
    };
    enrollment?: {
      id: string;
      planName: string;
      startDate: Date;
      endDate: Date;
      daysRemaining: number;
      status: EnrollmentStatus;
    };
    accessLogId: string;
    message: string;
  }> {
    await this.assertGymPlanAccess(academiaId);

    // 1. Identificar o aluno pelo QR Code universal, ID, CPF ou e-mail
    let cleanId = dto.studentIdentifier.trim();
    if (cleanId.startsWith('CONEXAO_FITNESS_USER:') || cleanId.startsWith('CONEXAO_FITNESS_STUDENT:') || cleanId.startsWith('CONEXAO_FITNESS_ACCESS:')) {
      const parts = cleanId.split(':');
      cleanId = parts[1] || cleanId;
    }

    const student = await this.userRepo
      .createQueryBuilder('user')
      .where('user.id = :id OR user.cpf = :id OR LOWER(user.email) = :email', {
        id: cleanId,
        email: cleanId.toLowerCase(),
      })
      .getOne();

    if (!student) {
      const log = this.accessLogRepo.create({
        academiaId,
        status: AccessStatus.DENIED,
        denialReason: 'Usuário Finex não encontrado para cobrança de Day Pass.',
        deviceInfo: dto.deviceInfo || 'Recepção Day Pass Finex',
      });
      const savedLog = await this.accessLogRepo.save(log);

      return {
        granted: false,
        isDayPass: true,
        reason: 'Usuário Finex não encontrado.',
        accessLogId: savedLog.id,
        message: 'Acesso Negado: Usuário Finex não localizado no sistema.',
      };
    }

    // 2. Determinar o valor do Day Pass da academia
    let amount = dto.customAmount;
    if (!amount || amount <= 0) {
      amount = await this.getDayPassPrice(academiaId);
    }

    // 3. Verificar saldo na carteira do aluno
    const balanceInfo = await this.walletService.getMyBalance(student.id);
    if (balanceInfo.current_balance < amount) {
      const log = this.accessLogRepo.create({
        academiaId,
        studentId: student.id,
        status: AccessStatus.DENIED,
        denialReason: `Saldo insuficiente na carteira Finex (Necessário: R$ ${amount.toFixed(2)} / Disponível: R$ ${balanceInfo.current_balance.toFixed(2)})`,
        deviceInfo: dto.deviceInfo || 'Recepção Day Pass Finex',
      });
      const savedLog = await this.accessLogRepo.save(log);

      return {
        granted: false,
        isDayPass: true,
        reason: `Saldo insuficiente na carteira Finex (Disponível: R$ ${balanceInfo.current_balance.toFixed(2)})`,
        requiredAmount: amount,
        currentBalance: balanceInfo.current_balance,
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
          avatarUrl: student.avatarUrl,
          cpf: student.cpf,
        },
        accessLogId: savedLog.id,
        message: `Acesso Recusado: Aluno possui apenas R$ ${balanceInfo.current_balance.toFixed(2)} na carteira Finex. Valor do Day Pass: R$ ${amount.toFixed(2)}.`,
      };
    }

    // 4. Debitar da carteira do aluno
    const newStudentBalance = await this.walletService.deductBalance(student.id, amount);

    // 5. Creditar na carteira da academia (split com taxa de plataforma de 10%)
    const platformFee = Number((amount * 0.1).toFixed(2));
    const academiaAmount = Number((amount - platformFee).toFixed(2));
    await this.walletService.addBalance(academiaId, academiaAmount);

    // 6. Criar registro de Matrícula Day Pass (1 dia)
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const qrAccessCode = this.generateQrAccessCode();
    const enrollment = this.enrollmentRepo.create({
      studentId: student.id,
      academiaId,
      planName: 'Day Pass Avulso Finex',
      amountPaid: amount.toFixed(2),
      paymentMethod: EnrollmentPaymentMethod.WALLET,
      paymentStatus: EnrollmentPaymentStatus.PAID,
      status: EnrollmentStatus.ACTIVE,
      startDate: now,
      endDate: endOfDay,
      qrAccessCode,
      notes: 'Debitado instantaneamente via QR Code da carteira Finex na recepção.',
    });
    const savedEnrollment = await this.enrollmentRepo.save(enrollment);

    // Gravar extrato para academia e para o aluno
    await this.walletService.recordTransaction({
      userId: academiaId,
      type: 'DAY_PASS',
      amount: amount,
      fee: platformFee,
      description: 'Day Pass Finex - Catraca Digital',
      sourceUserId: student.id,
      sourceUserName: student.name,
      sourceUserAvatar: student.avatarUrl,
      targetUserId: academiaId,
      referenceType: 'DAY_PASS',
      referenceId: savedEnrollment.id,
      paymentMethod: 'FINEX_WALLET',
    });

    await this.walletService.recordTransaction({
      userId: student.id,
      type: 'DEBIT',
      amount: amount,
      description: 'Day Pass Finex - Acesso Academia',
      sourceUserId: student.id,
      targetUserId: academiaId,
      referenceType: 'DAY_PASS',
      referenceId: savedEnrollment.id,
      paymentMethod: 'FINEX_WALLET',
    });

    // 7. Registrar log de acesso liberado
    const log = this.accessLogRepo.create({
      academiaId,
      enrollmentId: savedEnrollment.id,
      studentId: student.id,
      status: AccessStatus.GRANTED,
      deviceInfo: dto.deviceInfo || 'Recepção Day Pass Finex',
    });
    const savedLog = await this.accessLogRepo.save(log);

    // 8. Notificar aluno e academia
    const academiaUser = await this.userRepo.findOneBy({ id: academiaId });
    const academiaName = academiaUser?.name || 'Academia Parceira';

    await this.notificationsService.createNotification({
      userId: student.id,
      type: 'BOOKING_CONFIRMED',
      title: 'Day Pass Finex Liberado!',
      content: `Seu Day Pass na academia ${academiaName} foi liberado! R$ ${amount.toFixed(2)} foi debitado do saldo da sua carteira Finex. Bom treino!`,
      referenceId: savedEnrollment.id,
    });

    const firstName = student.name ? student.name.split(' ')[0] : 'Aluno';

    this.logger.log(
      `Day Pass Finex debitado: Aluno ${student.name} (R$ ${amount.toFixed(2)}) -> Academia ${academiaName}`,
    );

    return {
      granted: true,
      isDayPass: true,
      amountDebited: amount,
      newBalance: newStudentBalance,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        avatarUrl: student.avatarUrl,
        cpf: student.cpf,
      },
      enrollment: {
        id: savedEnrollment.id,
        planName: 'Day Pass Avulso Finex',
        startDate: savedEnrollment.startDate,
        endDate: savedEnrollment.endDate,
        daysRemaining: 1,
        status: EnrollmentStatus.ACTIVE,
      },
      accessLogId: savedLog.id,
      message: `Day Pass Liberado! R$ ${amount.toFixed(2)} debitado da carteira de ${firstName}.`,
    };
  }

  async validateAccess(
    academiaId: string,
    dto: ValidateAccessDto,
  ): Promise<{
    granted: boolean;
    isDayPass?: boolean;
    canChargeDayPass?: boolean;
    dayPassPrice?: number;
    studentBalance?: number;
    hasEnoughBalance?: boolean;
    reason?: string;
    student?: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string;
      cpf?: string;
    };
    enrollment?: {
      id: string;
      planName: string;
      startDate: Date;
      endDate: Date;
      daysRemaining: number;
      status: EnrollmentStatus;
    };
    accessLogId?: string;
    message: string;
  }> {
    await this.assertGymPlanAccess(academiaId);

    let cleanCode = dto.qrCode.trim();

    // Remove prefixos de URL se o payload vier formatado
    if (
      cleanCode.startsWith('CONEXAO_FITNESS_ACCESS:') ||
      cleanCode.startsWith('CONEXAO_FITNESS_USER:') ||
      cleanCode.startsWith('CONEXAO_FITNESS_STUDENT:')
    ) {
      const parts = cleanCode.split(':');
      cleanCode = parts[1] || cleanCode;
    }

    // Busca matrícula pelo QR Access Code ou pelo CPF do aluno
    const qb = this.enrollmentRepo
      .createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .where('enrollment.academiaId = :academiaId', { academiaId })
      .andWhere(
        '(enrollment.qrAccessCode = :code OR student.id = :code OR student.cpf = :code OR LOWER(student.email) = :codeEmail)',
        { code: cleanCode, codeEmail: cleanCode.toLowerCase() },
      )
      .orderBy('enrollment.endDate', 'DESC');

    const enrollment = await qb.getOne();

    const now = new Date();

    // 1. Caso a matrícula NÃO exista para esta academia, verificar se é um usuário Finex para Day Pass
    if (!enrollment) {
      // Buscar se existe um aluno cadastrado no Finex com esse identificador
      const studentUser = await this.userRepo
        .createQueryBuilder('user')
        .where('user.id = :id OR user.cpf = :id OR LOWER(user.email) = :email', {
          id: cleanCode,
          email: cleanCode.toLowerCase(),
        })
        .getOne();

      if (studentUser) {
        const dayPassPrice = await this.getDayPassPrice(academiaId);
        const balance = await this.walletService.getMyBalance(studentUser.id);
        const hasEnough = balance.current_balance >= dayPassPrice;

        return {
          granted: false,
          isDayPass: true,
          canChargeDayPass: true,
          dayPassPrice,
          studentBalance: balance.current_balance,
          hasEnoughBalance: hasEnough,
          student: {
            id: studentUser.id,
            name: studentUser.name,
            email: studentUser.email,
            avatarUrl: studentUser.avatarUrl,
            cpf: studentUser.cpf,
          },
          reason: 'Aluno sem matrícula mensal ativa nesta academia.',
          message: `Aluno ${studentUser.name} sem matrícula ativa. Day Pass disponível por R$ ${dayPassPrice.toFixed(2)} (Saldo na carteira: R$ ${balance.current_balance.toFixed(2)}).`,
        };
      }

      const log = this.accessLogRepo.create({
        academiaId,
        status: AccessStatus.DENIED,
        denialReason: 'Matrícula não encontrada nesta academia ou QR Code inválido.',
        deviceInfo: dto.deviceInfo || 'Catraca Principal',
      });
      const savedLog = await this.accessLogRepo.save(log);

      return {
        granted: false,
        reason: 'Matrícula não encontrada nesta academia ou QR Code inválido.',
        accessLogId: savedLog.id,
        message: 'Acesso Negado: Aluno não cadastrado ou QR code não reconhecido.',
      };
    }

    const student = enrollment.student;

    // 2. Caso o status esteja cancelado ou suspenso
    if (enrollment.status === EnrollmentStatus.CANCELLED) {
      const log = this.accessLogRepo.create({
        academiaId,
        enrollmentId: enrollment.id,
        studentId: student?.id,
        status: AccessStatus.DENIED,
        denialReason: 'Matrícula Cancelada.',
        deviceInfo: dto.deviceInfo || 'Catraca Principal',
      });
      const savedLog = await this.accessLogRepo.save(log);

      return {
        granted: false,
        reason: 'Matrícula Cancelada.',
        student: student
          ? { id: student.id, name: student.name, email: student.email, avatarUrl: student.avatarUrl, cpf: student.cpf }
          : undefined,
        accessLogId: savedLog.id,
        message: 'Acesso Negado: Matrícula cancelada no sistema.',
      };
    }

    if (enrollment.status === EnrollmentStatus.SUSPENDED) {
      const log = this.accessLogRepo.create({
        academiaId,
        enrollmentId: enrollment.id,
        studentId: student?.id,
        status: AccessStatus.DENIED,
        denialReason: 'Matrícula Suspensa. Favor procurar a recepção.',
        deviceInfo: dto.deviceInfo || 'Catraca Principal',
      });
      const savedLog = await this.accessLogRepo.save(log);

      return {
        granted: false,
        reason: 'Matrícula Suspensa. Favor procurar a recepção.',
        student: student
          ? { id: student.id, name: student.name, email: student.email, avatarUrl: student.avatarUrl, cpf: student.cpf }
          : undefined,
        accessLogId: savedLog.id,
        message: 'Acesso Negado: Matrícula suspensa.',
      };
    }

    // 3. Caso a matrícula esteja vencida
    const endDate = new Date(enrollment.endDate);
    const diffMs = endDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    if (diffMs <= 0 || enrollment.status === EnrollmentStatus.EXPIRED) {
      enrollment.status = EnrollmentStatus.EXPIRED;
      await this.enrollmentRepo.save(enrollment);

      const dayPassPrice = await this.getDayPassPrice(academiaId);
      const balance = student ? await this.walletService.getMyBalance(student.id) : { current_balance: 0 };
      const hasEnough = balance.current_balance >= dayPassPrice;

      const log = this.accessLogRepo.create({
        academiaId,
        enrollmentId: enrollment.id,
        studentId: student?.id,
        status: AccessStatus.DENIED,
        denialReason: `Matrícula Vencida em ${endDate.toLocaleDateString('pt-BR')}.`,
        deviceInfo: dto.deviceInfo || 'Catraca Principal',
      });
      const savedLog = await this.accessLogRepo.save(log);

      return {
        granted: false,
        canChargeDayPass: true,
        dayPassPrice,
        studentBalance: balance.current_balance,
        hasEnoughBalance: hasEnough,
        reason: `Matrícula Vencida em ${endDate.toLocaleDateString('pt-BR')}.`,
        student: student
          ? { id: student.id, name: student.name, email: student.email, avatarUrl: student.avatarUrl, cpf: student.cpf }
          : undefined,
        enrollment: {
          id: enrollment.id,
          planName: enrollment.planName,
          startDate: enrollment.startDate,
          endDate: enrollment.endDate,
          daysRemaining: 0,
          status: EnrollmentStatus.EXPIRED,
        },
        accessLogId: savedLog.id,
        message: `Acesso Negado: Matrícula venceu em ${endDate.toLocaleDateString('pt-BR')}. Deseja cobrar Day Pass na carteira Finex?`,
      };
    }

    // 4. Acesso Válido e Liberado!
    const log = this.accessLogRepo.create({
      academiaId,
      enrollmentId: enrollment.id,
      studentId: student?.id,
      status: AccessStatus.GRANTED,
      deviceInfo: dto.deviceInfo || 'Catraca Principal',
    });
    const savedLog = await this.accessLogRepo.save(log);

    const firstName = student?.name ? student.name.split(' ')[0] : 'Aluno';

    return {
      granted: true,
      student: student
        ? {
            id: student.id,
            name: student.name,
            email: student.email,
            avatarUrl: student.avatarUrl,
            cpf: student.cpf,
          }
        : undefined,
      enrollment: {
        id: enrollment.id,
        planName: enrollment.planName,
        startDate: enrollment.startDate,
        endDate: enrollment.endDate,
        daysRemaining,
        status: enrollment.status,
      },
      accessLogId: savedLog.id,
      message: `Acesso Liberado! Bem-vindo(a), ${firstName}! (${daysRemaining} dias restantes)`,
    };
  }

  // =========================================================================
  // 6. DASHBOARD, INDICADORES E LOGS DA ACADEMIA
  // =========================================================================

  async getGymDashboardStats(academiaId: string) {
    const tier = await this.checkGymPlanTier(academiaId);

    const totalActive = await this.enrollmentRepo.count({
      where: { academiaId, status: EnrollmentStatus.ACTIVE },
    });

    const totalAll = await this.enrollmentRepo.count({
      where: { academiaId },
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const checkinsToday = await this.accessLogRepo.count({
      where: {
        academiaId,
        status: AccessStatus.GRANTED,
        accessedAt: MoreThanOrEqual(startOfToday),
      },
    });

    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);

    const expiringSoon = await this.enrollmentRepo.count({
      where: {
        academiaId,
        status: EnrollmentStatus.ACTIVE,
        endDate: Between(new Date(), next7Days),
      },
    });

    // Calcular MRR estimado (soma dos valores das matrículas ativas)
    const activeEnrollments = await this.enrollmentRepo.find({
      where: { academiaId, status: EnrollmentStatus.ACTIVE },
      select: ['amountPaid'],
    });

    const estimatedMRR = activeEnrollments.reduce((acc, curr) => acc + Number(curr.amountPaid || 0), 0);

    return {
      tier,
      totalActiveStudents: totalActive,
      totalStudents: totalAll,
      checkinsToday,
      expiringSoon,
      estimatedMRR: Number(estimatedMRR.toFixed(2)),
    };
  }

  async getGymAccessLogs(academiaId: string, limit = 30): Promise<GymAccessLog[]> {
    return this.accessLogRepo.find({
      where: { academiaId },
      relations: ['student', 'enrollment'],
      order: { accessedAt: 'DESC' },
      take: limit,
    });
  }

  // =========================================================================
  // 7. CONSULTAS DO ALUNO (MINHAS MATRÍCULAS E PASSE QR CODE)
  // =========================================================================

  async getStudentEnrollments(studentId: string) {
    const enrollments = await this.enrollmentRepo.find({
      where: { studentId },
      relations: ['academia', 'academia.academiaProfile', 'plan'],
      order: { createdAt: 'DESC' },
    });

    const now = new Date();

    return enrollments.map((e) => {
      const end = new Date(e.endDate);
      const diffMs = end.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const isExpired = diffMs <= 0 || e.status === EnrollmentStatus.EXPIRED;

      return {
        ...e,
        isExpired,
        daysRemaining: isExpired ? 0 : daysRemaining,
        qrPayload: `CONEXAO_FITNESS_ACCESS:${e.qrAccessCode}:${e.academiaId}`,
      };
    });
  }

  async getStudentPass(studentId: string, enrollmentId: string) {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: enrollmentId, studentId },
      relations: ['academia', 'academia.academiaProfile', 'student'],
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula não encontrada.');
    }

    const now = new Date();
    const end = new Date(enrollment.endDate);
    const diffMs = end.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const isExpired = diffMs <= 0 || enrollment.status === EnrollmentStatus.EXPIRED;

    return {
      enrollmentId: enrollment.id,
      qrAccessCode: enrollment.qrAccessCode,
      qrPayload: `CONEXAO_FITNESS_ACCESS:${enrollment.qrAccessCode}:${enrollment.academiaId}`,
      planName: enrollment.planName,
      status: isExpired ? EnrollmentStatus.EXPIRED : enrollment.status,
      startDate: enrollment.startDate,
      endDate: enrollment.endDate,
      daysRemaining: isExpired ? 0 : daysRemaining,
      student: {
        id: enrollment.student.id,
        name: enrollment.student.name,
        avatarUrl: enrollment.student.avatarUrl,
        cpf: enrollment.student.cpf,
      },
      academia: {
        id: enrollment.academia.id,
        name: enrollment.academia.name,
        avatarUrl: enrollment.academia.avatarUrl,
        nomeFantasia: enrollment.academia.academiaProfile?.nomeFantasia,
        city: enrollment.academia.cityBase,
      },
    };
  }
}
