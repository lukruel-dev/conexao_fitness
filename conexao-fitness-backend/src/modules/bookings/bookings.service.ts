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

      // 8. Após a transação concluída com sucesso, cria a intenção de pagamento no Mercado Pago
      const paymentInfo = await this.paymentsService.createCheckoutSessionForBooking(
        createdBooking.id,
        Number(serviceData.price),
        serviceData.providerId,
      );

      return {
        ...createdBooking,
        checkoutUrl: paymentInfo.checkoutUrl,
        paymentIntentId: paymentInfo.paymentIntentId,
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

      // Atualiza booking primeiro para liberar o unique partial index antes de
      // checar outros bookings ativos (caso haja uma waitlist no futuro).
      booking.status = BookingStatus.CANCELLED;
      booking.cancelledAt = new Date();
      await manager.save(Booking, booking);

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

    booking.status = BookingStatus.CONFIRMED;
    const savedBooking = await this.bookingsRepo.save(booking);

    // Notifica as partes
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
}
