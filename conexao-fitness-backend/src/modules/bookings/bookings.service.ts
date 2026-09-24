import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';

import { Booking, BookingStatus } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { FilterBookingsDto } from './dto/filter-bookings.dto';
import { Service } from '../services/entities/service.entity';
import { ScheduleSlot } from '../services/entities/schedule-slot.entity';
import { ScheduleSlotStatus } from '../services/enums/schedule-slot-status.enum';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../notifications/email.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { WalletService } from '../wallet/wallet.service';

/**
 * Código de erro Postgres para unique_violation.
 * Capturado para transformar erros do índice parcial UQ_bookings_slot_active
 * em respostas HTTP 409 legíveis pelo cliente.
 */
const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepo: Repository<Booking>,

    @InjectRepository(Service)
    private readonly servicesRepo: Repository<Service>,

    @InjectRepository(ScheduleSlot)
    private readonly slotsRepo: Repository<ScheduleSlot>,

    private readonly dataSource: DataSource,
    private readonly paymentsService: PaymentsService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Cria um booking em transação com lock pessimista no slot.
   *
   * Camadas de proteção contra double-booking:
   *   L1 — slot.status !== AVAILABLE  (verificação de estado)
   *   L2 — SELECT ... FOR UPDATE no slot (lock pessimista serializa threads concorrentes)
   *   L3 — double-check por QueryBuilder dentro da mesma transação
   *   L4 — UNIQUE PARTIAL INDEX no banco (UQ_bookings_slot_active) capturado como ConflictException
   *
   * Fluxo:
   *  1. Valida service ativo.
   *  2. Busca slot com pessimistic_write lock (mesmo manager da transação).
   *  3. Valida que slot pertence ao service.
   *  4. Valida slot.status === AVAILABLE.
   *  5. Double-check: booking CONFIRMED|PENDING existente para o slot.
   *  6. Atualiza slot.status → BOOKED.
   *  Se o unique index disparar (race condition residual), relança como ConflictException.
   */
  async createBooking(dto: CreateBookingDto, studentId: string): Promise<any> {
    try {
      const { createdBooking, serviceData } = await this.dataSource.transaction(async (manager) => {
        // 1. Valida service
        const service = await manager.findOne(Service, {
          where: { id: dto.serviceId, isActive: true },
        });
        if (!service) {
          throw new NotFoundException('Service not found or inactive');
        }

        // 2. Busca slot com lock pessimista — DENTRO do manager da transação
        //    O lock garante SELECT ... FOR UPDATE na mesma conexão/transação.
        const slot = await manager.findOne(ScheduleSlot, {
          where: { id: dto.slotId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!slot) {
          throw new NotFoundException('Schedule slot not found');
        }

        // 3. Valida que o slot pertence ao service
        if (slot.serviceId !== dto.serviceId) {
          throw new BadRequestException(
            'Slot does not belong to the specified service',
          );
        }

        // 4. Valida disponibilidade (L1)
        if (slot.status !== ScheduleSlotStatus.AVAILABLE) {
          throw new BadRequestException(
            `Slot is not available (current status: ${slot.status})`,
          );
        }

        // 5. Double-check dentro da transação (L3)
        //    Usa manager.createQueryBuilder para permanecer na mesma conexão/transação.
        const existingActive = await manager
          .createQueryBuilder(Booking, 'b')
          .where('b."slotId" = :slotId', { slotId: dto.slotId })
          .andWhere('b.status IN (:...statuses)', {
            statuses: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
          })
          .getOne();

        if (existingActive) {
          throw new ConflictException('Slot already has an active booking');
        }

        // 6. Atualiza slot — usa enum, não string solta
        slot.status = ScheduleSlotStatus.BOOKED;
        await manager.save(ScheduleSlot, slot);

        // 7. Cria booking pendente de pagamento
        const booking = manager.create(Booking, {
          serviceId: dto.serviceId,
          slotId: dto.slotId,
          studentId: studentId,
          status: BookingStatus.PENDING,
          cancelledAt: null,
        });

        const savedBooking = await manager.save(Booking, booking);
        return { createdBooking: savedBooking, serviceData: service };
      });

      // 8. Após a transação concluída com sucesso, tenta criar a intenção de pagamento no Stripe
      let clientSecret: string | null = null;
      let paymentIntentId: string | null = null;
      
      try {
        const paymentInfo = await this.paymentsService.createPaymentIntentForBooking(
          createdBooking.id,
          Number(serviceData.price),
          serviceData.providerId,
        );
        clientSecret = paymentInfo.clientSecret;
        paymentIntentId = paymentInfo.paymentIntentId;
      } catch (paymentErr) {
        console.warn(`Failed to create Stripe PaymentIntent for booking ${createdBooking.id}: ${paymentErr.message}`);
        // Não lançamos o erro para permitir o pagamento via saldo da carteira como fallback
      }

      return {
        ...createdBooking,
        clientSecret,
        paymentIntentId,
      };
    } catch (err) {
      // L4: captura violação do unique partial index UQ_bookings_slot_active
      if (
        err instanceof QueryFailedError &&
        (err as QueryFailedError & { code: string }).code === PG_UNIQUE_VIOLATION
      ) {
        throw new ConflictException(
          'Slot already booked (concurrent request detected)',
        );
      }
      throw err;
    }
  }

  /**
   * Gera um novo PaymentIntent para um booking PENDING existente.
   */
  async retryPayment(bookingId: string, userId: string) {
    const booking = await this.bookingsRepo.findOne({
      where: { id: bookingId },
      relations: ['service'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.studentId !== userId) {
      throw new ForbiddenException('You do not own this booking');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Booking is not pending payment');
    }

    const paymentInfo = await this.paymentsService.createPaymentIntentForBooking(
      booking.id,
      Number(booking.service.price),
      booking.service.providerId,
    );

    return {
      clientSecret: paymentInfo.clientSecret,
      paymentIntentId: paymentInfo.paymentIntentId,
    };
  }

  /**
   * Paga um booking pendente usando o saldo da carteira do usuário.
   */
  async payWithWallet(bookingId: string, userId: string) {
    const booking = await this.bookingsRepo.findOne({
      where: { id: bookingId },
      relations: ['service'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.studentId !== userId) {
      throw new ForbiddenException('You do not own this booking');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Booking is not pending payment');
    }

    const price = Number(booking.service.price);

    // Deduz o saldo primeiro. Se falhar por falta de saldo, o WalletService lançará um erro
    await this.walletService.deductBalance(userId, price);

    // Saldo deduzido com sucesso, vamos confirmar a reserva e disparar notificações
    return this.confirmBooking(booking.id);
  }

  /**
   * Cancela um booking.
   *
   * Regras de domínio:
   * - Somente o dono (studentId) pode cancelar.
   * - Idempotência: se já está CANCELLED, lança BadRequestException.
   * - Devolve o slot para AVAILABLE apenas se não houver outro booking ativo
   *   para o mesmo slot (prepara terreno para waitlist).
   *
   * Nota sobre ScheduleSlot.studentId:
   *   Esse campo existe na entidade mas é uma fonte de verdade DUPLICADA.
   *   A fonte canônica é Booking.studentId. Não tocamos em ScheduleSlot.studentId
   *   aqui — ele deve ser depreciado (ver comentário na entidade ScheduleSlot).
   */
  async cancelBooking(bookingId: string, user?: { id: string, role?: string }): Promise<Booking> {
    return this.dataSource.transaction(async (manager) => {
      // Busca booking COM a relação slot e service carregada
      const booking = await manager.findOne(Booking, {
        where: { id: bookingId },
        relations: ['slot', 'service', 'student'],
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (user && user.role !== 'ADMIN' && booking.studentId !== user.id) {
        throw new ForbiddenException(
          'You are not allowed to cancel this booking',
        );
      }

      if (booking.status === BookingStatus.CANCELLED) {
        throw new BadRequestException('Booking is already cancelled');
      }

      const previousStatus = booking.status;

      // Atualiza booking primeiro para liberar o unique partial index antes de
      // checar outros bookings ativos (caso haja uma waitlist no futuro).
      booking.status = BookingStatus.CANCELLED;
      booking.cancelledAt = new Date();
      await manager.save(Booking, booking);

      // Refund process se a reserva já estava paga (CONFIRMED)
      if (previousStatus === BookingStatus.CONFIRMED && booking.service) {
        const price = Number(booking.service.price);
        try {
          await this.walletService.processBookingRefund({
            studentId: booking.studentId,
            providerId: booking.service.providerId,
            amount: price,
            bookingId: booking.id,
            serviceName: booking.service.name || 'Serviço / Plano',
          });
        } catch (err) {
          console.error('Erro ao processar estorno de saldo:', err);
        }
      }

      // Devolve slot para AVAILABLE somente se não houver outro booking ativo.
      // O filtro exclui explicitamente CANCELLED (status IN CONFIRMED, PENDING).
      if (booking.slot) {
        const otherActive = await manager
          .createQueryBuilder(Booking, 'b')
          .where('b."slotId" = :slotId', { slotId: booking.slotId })
          .andWhere('b.id != :bookingId', { bookingId })
          .andWhere('b.status IN (:...statuses)', {
            statuses: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
          })
          .getOne();

        if (!otherActive) {
          booking.slot.status = ScheduleSlotStatus.AVAILABLE;
          await manager.save(ScheduleSlot, booking.slot);
        }
      }

      // Notifica as partes (fora da transação principal para não falhar o rollback)
      setTimeout(async () => {
        try {
          const provider = await this.userRepo.findOneBy({ id: booking.service.providerId });
          if (provider && booking.student) {
            // Notifica Aluno
            await this.notificationsService.create(booking.student.id, 'Reserva Cancelada', `Sua reserva para ${booking.service.name} foi cancelada.`, NotificationType.BOOKING);
            await this.emailService.sendEmail(booking.student.email, 'Reserva Cancelada', `<p>Sua reserva para <strong>${booking.service.name}</strong> foi cancelada.</p>`);
            
            // Notifica Profissional
            await this.notificationsService.create(provider.id, 'Reserva Cancelada', `A reserva de ${booking.student.name} para ${booking.service.name} foi cancelada.`, NotificationType.BOOKING);
            await this.emailService.sendEmail(provider.email, 'Reserva Cancelada', `<p>O aluno <strong>${booking.student.name}</strong> cancelou a reserva para <strong>${booking.service.name}</strong>.</p>`);
          }
        } catch (e) {
          console.error('Erro ao enviar notificacao de cancelamento', e);
        }
      }, 0);

      return booking;
    });
  }

  async confirmBooking(bookingId: string): Promise<Booking> {
    const booking = await this.bookingsRepo.findOne({
      where: { id: bookingId },
      relations: ['service', 'student', 'slot'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === BookingStatus.CONFIRMED) {
      return booking; // Já confirmado
    }

    booking.status = BookingStatus.CONFIRMED;
    const savedBooking = await this.bookingsRepo.save(booking);

    // Repassa o saldo para o profissional como pendente (escrow) independentemente de como pagou
    await this.walletService.addBalance(booking.service.providerId, Number(booking.service.price), { type: 'PENDING' });

    // Notifica as partes de forma assíncrona para não travar a requisição
    setTimeout(async () => {
      try {
        const provider = await this.userRepo.findOneBy({ id: booking.service.providerId });
        if (provider && booking.student) {
          // Notifica Aluno
          await this.notificationsService.create(booking.student.id, 'Reserva Confirmada!', `Sua reserva para ${booking.service.name} está confirmada.`, NotificationType.BOOKING);
          await this.emailService.sendEmail(booking.student.email, 'Reserva Confirmada', `<p>Parabéns, sua reserva para <strong>${booking.service.name}</strong> foi confirmada!</p>`);
          
          // Notifica Profissional
          await this.notificationsService.create(provider.id, 'Nova Reserva Confirmada', `Você tem uma nova reserva confirmada de ${booking.student.name} para ${booking.service.name}.`, NotificationType.BOOKING);
          await this.emailService.sendEmail(provider.email, 'Nova Reserva Confirmada', `<p>O aluno <strong>${booking.student.name}</strong> acabou de confirmar uma reserva para <strong>${booking.service.name}</strong>!</p>`);
        }
      } catch (e) {
        console.error('Erro ao enviar notificacao de confirmacao', e);
      }
    }, 0);

    return savedBooking;
  }

  /**
   * Lista todos os bookings de um aluno, do mais recente ao mais antigo.
   * Carrega relações service e slot em JOIN único (sem N+1).
   */
  async listStudentBookings(
    studentId: string,
    filter?: FilterBookingsDto,
  ): Promise<Booking[]> {
    const qb = this.bookingsRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.slot', 'slot')
      .where('booking."studentId" = :studentId', { studentId })
      .orderBy('booking.createdAt', 'DESC');

    if (filter?.status) {
      qb.andWhere('booking.status = :status', { status: filter.status });
    }

    return qb.getMany();
  }

  /**
   * Lista todos os bookings de um service, com filtro opcional de status.
   * Carrega relações slot e student em JOIN único (sem N+1).
   */
  async listServiceBookings(
    serviceId: string,
    providerId: string,
    filter?: FilterBookingsDto,
  ): Promise<Booking[]> {
    const service = await this.servicesRepo.findOneBy({ id: serviceId });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.providerId !== providerId) {
      throw new ForbiddenException('Você não pode acessar reservas de um serviço que não é seu');
    }

    const qb = this.bookingsRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.slot', 'slot')
      .leftJoinAndSelect('booking.student', 'student')
      .where('booking."serviceId" = :serviceId', { serviceId })
      .orderBy('slot.startsAt', 'ASC');

    if (filter?.status) {
      qb.andWhere('booking.status = :status', { status: filter.status });
    }

    return qb.getMany();
  }

  /**
   * Lista todos os bookings recebidos por um profissional (em todos os seus serviços).
   * Carrega relações service, slot e student.
   */
  async listProviderBookings(
    providerId: string,
    filter?: FilterBookingsDto,
  ): Promise<Booking[]> {
    const qb = this.bookingsRepo
      .createQueryBuilder('booking')
      .innerJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.slot', 'slot')
      .leftJoinAndSelect('booking.student', 'student')
      .where('service."providerId" = :providerId', { providerId })
      .orderBy('slot.startsAt', 'ASC');

    if (filter?.status) {
      qb.andWhere('booking.status = :status', { status: filter.status });
    }

    return qb.getMany();
  }

  /**
   * O profissional solicita o cancelamento de uma aula/plano, informando o motivo.
   * O cancelamento fica pendente de confirmação do aluno.
   */
  async requestCancellation(
    bookingId: string,
    user: { id: string; role?: string },
    reason: string,
  ): Promise<Booking> {
    const booking = await this.bookingsRepo.findOne({
      where: { id: bookingId },
      relations: ['service', 'student'],
    });

    if (!booking) {
      throw new NotFoundException('Reserva não encontrada');
    }

    const isProvider = booking.service?.providerId === user.id;
    const isAdmin = user.role === 'ADMIN';
    if (!isProvider && !isAdmin) {
      throw new ForbiddenException(
        'Apenas o profissional responsável pode solicitar o cancelamento desta reserva',
      );
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Esta reserva já está cancelada');
    }

    booking.cancellationRequestedAt = new Date();
    booking.cancellationReason = reason;
    booking.cancellationRequestedBy = 'PROVIDER';

    const saved = await this.bookingsRepo.save(booking);

    // Notifica o aluno para confirmação
    try {
      const provider = await this.userRepo.findOneBy({ id: booking.service.providerId });
      const providerName = provider?.name || 'Seu profissional';
      await this.notificationsService.create(
        booking.studentId,
        'Solicitação de Cancelamento',
        `${providerName} solicitou o cancelamento de "${booking.service.name}". Motivo: ${reason}. Acesse seus agendamentos para confirmar ou recusar.`,
        NotificationType.BOOKING,
      );
      if (booking.student?.email) {
        await this.emailService.sendEmail(
          booking.student.email,
          'Solicitação de Cancelamento de Reserva',
          `<p>O profissional <strong>${providerName}</strong> solicitou o cancelamento da reserva <strong>${booking.service.name}</strong>.</p><p><strong>Motivo:</strong> ${reason}</p><p>Acesse o aplicativo Finex para confirmar ou recusar a solicitação.</p>`,
        );
      }
    } catch (e) {
      console.error('Erro ao notificar aluno sobre cancelamento solicitado:', e);
    }

    return saved;
  }

  /**
   * O aluno confirma a solicitação de cancelamento feita pelo profissional.
   * A reserva é cancelada, os estornos são efetuados e ambos são notificados.
   */
  async confirmCancellationByStudent(
    bookingId: string,
    user: { id: string; role?: string },
  ): Promise<Booking> {
    const booking = await this.bookingsRepo.findOne({
      where: { id: bookingId },
      relations: ['service', 'student'],
    });

    if (!booking) {
      throw new NotFoundException('Reserva não encontrada');
    }

    if (user.role !== 'ADMIN' && booking.studentId !== user.id) {
      throw new ForbiddenException('Apenas o aluno titular pode confirmar o cancelamento');
    }

    // Executa o cancelamento oficial da reserva
    const cancelled = await this.cancelBooking(bookingId, user);

    // Notifica o profissional sobre a confirmação do aluno
    try {
      const provider = await this.userRepo.findOneBy({ id: booking.service.providerId });
      if (provider) {
        await this.notificationsService.create(
          provider.id,
          'Cancelamento Confirmado pelo Aluno',
          `O aluno ${booking.student?.name || 'Aluno'} confirmou o cancelamento de "${booking.service?.name}".`,
          NotificationType.BOOKING,
        );
      }
    } catch (e) {
      console.error('Erro ao notificar profissional sobre confirmação de cancelamento:', e);
    }

    return cancelled;
  }

  /**
   * O aluno recusa a solicitação de cancelamento feita pelo profissional.
   * A solicitação é limpa e a reserva continua ativa.
   */
  async rejectCancellationByStudent(
    bookingId: string,
    user: { id: string; role?: string },
  ): Promise<Booking> {
    const booking = await this.bookingsRepo.findOne({
      where: { id: bookingId },
      relations: ['service', 'student'],
    });

    if (!booking) {
      throw new NotFoundException('Reserva não encontrada');
    }

    if (user.role !== 'ADMIN' && booking.studentId !== user.id) {
      throw new ForbiddenException('Apenas o aluno titular pode responder ao cancelamento');
    }

    booking.cancellationRequestedAt = null;
    booking.cancellationReason = null;
    booking.cancellationRequestedBy = null;

    const saved = await this.bookingsRepo.save(booking);

    // Notifica o profissional sobre a recusa do aluno
    try {
      const provider = await this.userRepo.findOneBy({ id: booking.service.providerId });
      if (provider) {
        await this.notificationsService.create(
          provider.id,
          'Solicitação de Cancelamento Recusada',
          `O aluno ${booking.student?.name || 'Aluno'} recusou a solicitação de cancelamento de "${booking.service?.name}". A reserva continua ativa.`,
          NotificationType.BOOKING,
        );
      }
    } catch (e) {
      console.error('Erro ao notificar profissional sobre recusa de cancelamento:', e);
    }

    return saved;
  }
}
