import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletAccount } from './entities/wallet-account.entity';
import { PaymentIntent } from './entities/payment-intent.entity';
import { WalletTransaction, WalletTransactionType } from './entities/wallet-transaction.entity';
import { WalletWithdrawal } from './entities/wallet-withdrawal.entity';
import { CreateTopupDto } from './dto/create-topup.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import { SavePixSettingsDto } from './dto/save-pix-settings.dto';
import { QRService } from '../qr/qr.service';
import { PaymentsService } from '../payments/payments.service';
import { User } from '../users/entities/user.entity';
import { GymAccessLog } from '../memberships/entities/gym-access-log.entity';
import { GymEnrollment } from '../memberships/entities/gym-enrollment.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectRepository(WalletAccount)
    private readonly walletRepo: Repository<WalletAccount>,
    @InjectRepository(PaymentIntent)
    private readonly paymentIntentRepo: Repository<PaymentIntent>,
    @InjectRepository(WalletTransaction)
    private readonly transactionRepo: Repository<WalletTransaction>,
    @InjectRepository(WalletWithdrawal)
    private readonly withdrawalRepo: Repository<WalletWithdrawal>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(GymAccessLog)
    private readonly accessLogRepo: Repository<GymAccessLog>,
    @InjectRepository(GymEnrollment)
    private readonly enrollmentRepo: Repository<GymEnrollment>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly qrService: QRService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async getMyBalance(userId: string) {
    let wallet = await this.walletRepo.findOne({
      where: { ownerId: userId, ownerType: 'USER' },
    });

    if (!wallet) {
      wallet = this.walletRepo.create({
        ownerId: userId,
        ownerType: 'USER',
        currency: 'BRL',
        currentBalance: '0.00',
        pendingBalance: '0.00',
        status: 'ACTIVE',
      });
      wallet = await this.walletRepo.save(wallet);
    }

    // Calcular estatísticas agregadas (Total faturado e total sacado)
    const withdrawals = await this.withdrawalRepo.find({
      where: { userId, status: 'COMPLETED' },
    });
    const totalWithdrawn = withdrawals.reduce((acc, w) => acc + Number(w.amount), 0);

    return {
      wallet_account_id: wallet.id,
      currency: wallet.currency,
      current_balance: Number(wallet.currentBalance),
      pending_balance: Number(wallet.pendingBalance),
      total_withdrawn: totalWithdrawn,
      pix_settings: {
        pixKeyType: wallet.pixKeyType || null,
        pixKey: wallet.pixKey || null,
        pixHolderName: wallet.pixHolderName || null,
        bankName: wallet.bankName || null,
      },
    };
  }

  async savePixSettings(userId: string, dto: SavePixSettingsDto) {
    let wallet = await this.walletRepo.findOne({
      where: { ownerId: userId, ownerType: 'USER' },
    });

    if (!wallet) {
      wallet = this.walletRepo.create({
        ownerId: userId,
        ownerType: 'USER',
        currency: 'BRL',
        currentBalance: '0.00',
        pendingBalance: '0.00',
        status: 'ACTIVE',
      });
    }

    wallet.pixKeyType = dto.pixKeyType;
    wallet.pixKey = dto.pixKey.trim();
    if (dto.pixHolderName) wallet.pixHolderName = dto.pixHolderName.trim();
    if (dto.bankName) wallet.bankName = dto.bankName.trim();

    await this.walletRepo.save(wallet);

    return {
      success: true,
      message: 'Chave PIX padrão salva com sucesso.',
      pix_settings: {
        pixKeyType: wallet.pixKeyType,
        pixKey: wallet.pixKey,
        pixHolderName: wallet.pixHolderName,
        bankName: wallet.bankName,
      },
    };
  }

  async creditDeposit(userId: string, amount: number, description: string) {
    let wallet = await this.walletRepo.findOne({
      where: { ownerId: userId, ownerType: 'USER' },
    });
    if (!wallet) {
      wallet = this.walletRepo.create({
        ownerId: userId,
        ownerType: 'USER',
        currency: 'BRL',
        currentBalance: '0.00',
        pendingBalance: '0.00',
        status: 'ACTIVE',
      });
    }
    const current = Number(wallet.currentBalance || 0);
    const updated = current + amount;
    wallet.currentBalance = updated.toFixed(2);
    await this.walletRepo.save(wallet);

    const tx = this.transactionRepo.create({
      userId,
      type: 'TOPUP',
      amount: amount.toFixed(2),
      fee: '0.00',
      netAmount: amount.toFixed(2),
      status: 'COMPLETED',
      description,
      paymentMethod: 'FINEX_POINTS',
    });
    await this.transactionRepo.save(tx);
    return wallet;
  }

  async requestWithdrawal(userId: string, dto: RequestWithdrawalDto) {
    const amount = Number(dto.amount);
    if (isNaN(amount) || amount < 5) {
      throw new BadRequestException('O valor mínimo para saque via PIX é de R$ 5,00.');
    }

    const wallet = await this.walletRepo.findOne({
      where: { ownerId: userId, ownerType: 'USER' },
    });

    if (!wallet) {
      throw new BadRequestException('Carteira não encontrada para este usuário.');
    }

    const currentBal = Number(wallet.currentBalance);
    if (currentBal < amount) {
      throw new BadRequestException(
        `Saldo insuficiente para saque. Disponível: R$ ${currentBal.toFixed(2)} - Solicitado: R$ ${amount.toFixed(2)}`,
      );
    }

    // Gerar protocolo de transferência PIX único
    const timestamp = Date.now().toString().slice(-6);
    const randomHex = Math.floor(1000 + Math.random() * 9000).toString();
    const transferProtocol = `PIX-CF-${timestamp}-${randomHex}`;

    // Deduzir o saldo
    const newBal = currentBal - amount;
    wallet.currentBalance = newBal.toFixed(2);

    // Salvar como padrão se solicitado
    if (dto.saveAsDefault) {
      wallet.pixKeyType = dto.pixKeyType;
      wallet.pixKey = dto.pixKey.trim();
      if (dto.holderName) wallet.pixHolderName = dto.holderName.trim();
      if (dto.bankName) wallet.bankName = dto.bankName.trim();
    }

    await this.walletRepo.save(wallet);

    // Registrar o saque
    const withdrawal = this.withdrawalRepo.create({
      userId,
      amount: amount.toFixed(2),
      fee: '0.00',
      netAmount: amount.toFixed(2),
      pixKeyType: dto.pixKeyType,
      pixKey: dto.pixKey.trim(),
      holderName: dto.holderName || wallet.pixHolderName,
      bankName: dto.bankName || wallet.bankName,
      status: 'COMPLETED',
      transferProtocol,
      processedAt: new Date(),
    });
    const savedWithdrawal = await this.withdrawalRepo.save(withdrawal);

    // Registrar no extrato de transações
    const transaction = this.transactionRepo.create({
      userId,
      type: 'WITHDRAWAL',
      amount: amount.toFixed(2),
      fee: '0.00',
      netAmount: (-amount).toFixed(2),
      status: 'COMPLETED',
      description: `Saque PIX (${dto.pixKeyType}: ${dto.pixKey})`,
      pixKey: dto.pixKey,
      pixKeyType: dto.pixKeyType,
      referenceType: 'WITHDRAWAL',
      referenceId: savedWithdrawal.id,
      paymentMethod: 'PIX',
    });
    await this.transactionRepo.save(transaction);

    this.logger.log(`Saque PIX processado: Usuário ${userId} | Valor R$ ${amount.toFixed(2)} | Protocolo: ${transferProtocol}`);

    return {
      success: true,
      message: 'Saque via PIX realizado com sucesso!',
      withdrawal: savedWithdrawal,
      new_balance: newBal,
    };
  }

  async getWithdrawals(userId: string) {
    return this.withdrawalRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async recordTransaction(params: {
    userId: string;
    type: WalletTransactionType;
    amount: number;
    fee?: number;
    description: string;
    sourceUserId?: string;
    sourceUserName?: string;
    sourceUserAvatar?: string;
    targetUserId?: string;
    referenceType?: string;
    referenceId?: string;
    paymentMethod?: string;
  }) {
    const fee = params.fee || 0;
    const netAmount = params.type === 'DEBIT' || params.type === 'WITHDRAWAL'
      ? -(params.amount)
      : params.amount - fee;

    const tx = this.transactionRepo.create({
      userId: params.userId,
      type: params.type,
      amount: params.amount.toFixed(2),
      fee: fee.toFixed(2),
      netAmount: netAmount.toFixed(2),
      status: 'COMPLETED',
      description: params.description,
      sourceUserId: params.sourceUserId,
      sourceUserName: params.sourceUserName,
      sourceUserAvatar: params.sourceUserAvatar,
      targetUserId: params.targetUserId,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      paymentMethod: params.paymentMethod,
    });

    return this.transactionRepo.save(tx);
  }

  async getStatement(userId: string) {
    // 1. Obter todas as transações gravadas na tabela wallet_transactions
    const explicitTxs = await this.transactionRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    // 2. Para garantir que acessos de catraca / Day Passes, matrículas e agendamentos existentes
    // apareçam sempre com o nome do aluno, consolidamos e enriquecemos os registros:
    const txMap = new Map<string, any>();
    explicitTxs.forEach((tx) => {
      txMap.set(tx.referenceId || tx.id, {
        id: tx.id,
        type: tx.type,
        amount: Number(tx.amount),
        fee: Number(tx.fee),
        netAmount: Number(tx.netAmount),
        status: tx.status,
        description: tx.description,
        sourceUserId: tx.sourceUserId,
        sourceUserName: tx.sourceUserName,
        sourceUserAvatar: tx.sourceUserAvatar,
        referenceType: tx.referenceType,
        referenceId: tx.referenceId,
        paymentMethod: tx.paymentMethod,
        pixKey: tx.pixKey,
        createdAt: tx.createdAt,
      });
    });

    // 3. Buscar acessos concedidos da academia (Day Passes)
    try {
      const accessLogs = await this.accessLogRepo.find({
        where: { academiaId: userId, status: 'GRANTED' as any },
        relations: ['student'],
        order: { accessedAt: 'DESC' },
        take: 100,
      });

      for (const log of accessLogs) {
        if (!txMap.has(log.id)) {
          const isDayPass = log.denialReason?.includes('Day Pass') || log.deviceInfo?.includes('Day Pass') || true;
          const studentName = log.student?.name || 'Aluno Finex';
          const amount = 25.0; // Day pass default
          const fee = 2.5;

          txMap.set(log.id, {
            id: `log-${log.id}`,
            type: 'DAY_PASS',
            amount: amount,
            fee: fee,
            netAmount: amount - fee,
            status: 'COMPLETED',
            description: `Day Pass Finex - Catraca Digital`,
            sourceUserId: log.studentId,
            sourceUserName: studentName,
            sourceUserAvatar: log.student?.avatarUrl,
            referenceType: 'DAY_PASS',
            referenceId: log.id,
            paymentMethod: 'FINEX_WALLET',
            createdAt: log.accessedAt,
          });
        }
      }
    } catch (e) {
      this.logger.warn(`Erro ao buscar access logs para extrato: ${e.message}`);
    }

    // 4. Buscar matrículas recebidas pela academia
    try {
      const enrollments = await this.enrollmentRepo.find({
        where: { academiaId: userId },
        relations: ['student', 'plan'],
        order: { createdAt: 'DESC' },
        take: 100,
      });

      for (const enr of enrollments) {
        if (!txMap.has(enr.id)) {
          const amount = Number(enr.amountPaid) || 0;
          if (amount > 0) {
            const studentName = enr.student?.name || 'Aluno Matriculado';
            txMap.set(enr.id, {
              id: `enr-${enr.id}`,
              type: 'ENROLLMENT',
              amount: amount,
              fee: 0,
              netAmount: amount,
              status: enr.paymentStatus === 'PAID' ? 'COMPLETED' : 'PENDING',
              description: `Matrícula: ${enr.planName || enr.plan?.name || 'Plano de Acesso'}`,
              sourceUserId: enr.studentId,
              sourceUserName: studentName,
              sourceUserAvatar: enr.student?.avatarUrl,
              referenceType: 'ENROLLMENT',
              referenceId: enr.id,
              paymentMethod: enr.paymentMethod || 'MANUAL',
              createdAt: enr.createdAt,
            });
          }
        }
      }
    } catch (e) {
      this.logger.warn(`Erro ao buscar enrollments para extrato: ${e.message}`);
    }

    // 5. Buscar agendamentos de profissionais
    try {
      const bookings = await this.bookingRepo
        .createQueryBuilder('b')
        .innerJoinAndSelect('b.service', 's')
        .leftJoinAndSelect('b.student', 'student')
        .where('s.providerId = :userId', { userId })
        .orderBy('b.createdAt', 'DESC')
        .take(100)
        .getMany();

      for (const bk of bookings) {
        if (!txMap.has(bk.id)) {
          const amount = Number(bk.service?.price) || 0;
          if (amount > 0) {
            const studentName = bk.student?.name || 'Cliente';
            txMap.set(bk.id, {
              id: `bk-${bk.id}`,
              type: 'BOOKING',
              amount: amount,
              fee: 0,
              netAmount: amount,
              status: bk.status === BookingStatus.CONFIRMED || bk.status === BookingStatus.COMPLETED ? 'COMPLETED' : 'PENDING',
              description: `Aula / Atendimento: ${bk.service?.name || 'Serviço'}`,
              sourceUserId: bk.studentId,
              sourceUserName: studentName,
              sourceUserAvatar: bk.student?.avatarUrl,
              referenceType: 'BOOKING',
              referenceId: bk.id,
              paymentMethod: 'STRIPE',
              createdAt: bk.createdAt,
            });
          }
        }
      }
    } catch (e) {
      this.logger.warn(`Erro ao buscar bookings para extrato: ${e.message}`);
    }

    // Ordenar todas as transações por data decrescente
    const transactions = Array.from(txMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Calcular totais
    let totalEarned = 0;
    let totalAccessRevenue = 0;
    let totalEnrollmentRevenue = 0;
    let totalServicesRevenue = 0;
    let totalAccessesCount = 0;

    for (const tx of transactions) {
      if (tx.type === 'DAY_PASS' || tx.referenceType === 'DAY_PASS') {
        totalAccessRevenue += tx.netAmount || tx.amount;
        totalEarned += tx.netAmount || tx.amount;
        totalAccessesCount += 1;
      } else if (tx.type === 'ENROLLMENT' || tx.referenceType === 'ENROLLMENT') {
        totalEnrollmentRevenue += tx.netAmount || tx.amount;
        totalEarned += tx.netAmount || tx.amount;
      } else if (tx.type === 'BOOKING' || tx.referenceType === 'BOOKING') {
        totalServicesRevenue += tx.netAmount || tx.amount;
        totalEarned += tx.netAmount || tx.amount;
      } else if (tx.type === 'CREDIT' || tx.type === 'TOPUP') {
        totalEarned += tx.netAmount || tx.amount;
      }
    }

    return {
      transactions,
      summary: {
        totalEarned,
        totalAccessRevenue,
        totalEnrollmentRevenue,
        totalServicesRevenue,
        totalAccessesCount,
      },
    };
  }

  async createTopup(userId: string, dto: CreateTopupDto) {
    const intent = this.paymentIntentRepo.create({
      payerUserId: userId,
      amount: dto.amount.toFixed(2),
      currency: 'BRL',
      method: dto.method,
      purpose: 'WALLET_TOPUP',
      status: 'PENDING',
    });

    const saved = await this.paymentIntentRepo.save(intent);

    const paymentInfo = await this.paymentsService.createPaymentIntentForTopup(userId, saved.id, dto.amount);

    return {
      payment_intent_id: saved.id,
      amount: Number(saved.amount),
      currency: saved.currency,
      method: saved.method,
      status: saved.status,
      clientSecret: paymentInfo.clientSecret,
      stripePaymentIntentId: paymentInfo.paymentIntentId,
    };
  }

  async simulateTopupSuccess(paymentIntentId: string) {
    const intent = await this.paymentIntentRepo.findOne({
      where: { id: paymentIntentId },
    });

    if (!intent || intent.status !== 'PENDING') {
      throw new Error('PaymentIntent inválido ou já processado');
    }

    intent.status = 'SUCCEEDED';
    intent.updatedAt = new Date();
    await this.paymentIntentRepo.save(intent);

    const amountNumber = Number(intent.amount);
    await this.getMyBalance(intent.payerUserId);

    const wallet = await this.walletRepo.findOneOrFail({
      where: { ownerId: intent.payerUserId, ownerType: 'USER' },
    });

    const newBalance = Number(wallet.currentBalance) + amountNumber;
    wallet.currentBalance = newBalance.toFixed(2);
    await this.walletRepo.save(wallet);

    // Gravar transação
    await this.recordTransaction({
      userId: intent.payerUserId,
      type: 'TOPUP',
      amount: amountNumber,
      description: 'Recarga de Saldo na Carteira',
      referenceType: 'TOPUP',
      referenceId: intent.id,
      paymentMethod: intent.method,
    });

    return {
      payment_intent_id: intent.id,
      status: intent.status,
      new_balance: newBalance,
    };
  }

  async payQrWithCredits(userId: string, qrChargeId: string) {
    const qr = await this.qrService.getQrCharge(qrChargeId);
    if (!qr) {
      throw new Error('QRCharge não encontrado');
    }

    if (qr.status !== 'PENDING') {
      throw new Error('QRCharge já processado ou inválido');
    }

    if (qr.expires_at && new Date(qr.expires_at) < new Date()) {
      throw new Error('QRCharge expirado');
    }

    const amount = Number(qr.amount);

    const balanceInfo = await this.getMyBalance(userId);
    if (balanceInfo.current_balance < amount) {
      throw new Error('Saldo insuficiente na carteira');
    }

    const wallet = await this.walletRepo.findOneOrFail({
      where: { ownerId: userId, ownerType: 'USER' },
    });

    const newBalance = Number(wallet.currentBalance) - amount;
    wallet.currentBalance = newBalance.toFixed(2);
    await this.walletRepo.save(wallet);

    await this.qrService.markAsPaid(qrChargeId);

    return {
      qr_charge_id: qrChargeId,
      paid_amount: amount,
      new_balance: newBalance,
    };
  }

  async deductBalance(userId: string, amount: number) {
    const balanceInfo = await this.getMyBalance(userId);
    if (balanceInfo.current_balance < amount) {
      throw new BadRequestException('Saldo insuficiente na carteira');
    }

    const wallet = await this.walletRepo.findOneOrFail({
      where: { ownerId: userId, ownerType: 'USER' },
    });

    const newBalance = Number(wallet.currentBalance) - amount;
    wallet.currentBalance = newBalance.toFixed(2);
    await this.walletRepo.save(wallet);

    return newBalance;
  }

  async addBalance(userId: string, amount: number, options?: { type: 'AVAILABLE' | 'PENDING' }) {
    await this.getMyBalance(userId);

    const wallet = await this.walletRepo.findOneOrFail({
      where: { ownerId: userId, ownerType: 'USER' },
    });

    if (options?.type === 'PENDING') {
      const newPending = Number(wallet.pendingBalance) + amount;
      wallet.pendingBalance = newPending.toFixed(2);
    } else {
      const newBalance = Number(wallet.currentBalance) + amount;
      wallet.currentBalance = newBalance.toFixed(2);
    }

    await this.walletRepo.save(wallet);
    return wallet;
  }

  async releasePendingBalance(userId: string, amount: number) {
    const wallet = await this.walletRepo.findOneOrFail({
      where: { ownerId: userId, ownerType: 'USER' },
    });

    const pending = Number(wallet.pendingBalance);
    if (pending < amount) {
      throw new Error('Saldo pendente insuficiente para liberação');
    }

    wallet.pendingBalance = (pending - amount).toFixed(2);
    wallet.currentBalance = (Number(wallet.currentBalance) + amount).toFixed(2);

    await this.walletRepo.save(wallet);
    return wallet;
  }

  async refundPendingBalance(userId: string, amount: number) {
    const wallet = await this.walletRepo.findOneOrFail({
      where: { ownerId: userId, ownerType: 'USER' },
    });

    const pending = Number(wallet.pendingBalance);
    if (pending < amount) {
      throw new Error('Saldo pendente insuficiente para estorno');
    }

    wallet.pendingBalance = (pending - amount).toFixed(2);
    await this.walletRepo.save(wallet);
    return wallet;
  }
}
