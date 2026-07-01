import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryFailedError } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { BookingsService } from './bookings.service';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Service } from '../services/entities/service.entity';
import { ScheduleSlot } from '../services/entities/schedule-slot.entity';
import { ScheduleSlotStatus } from '../services/enums/schedule-slot-status.enum';
import { CreateBookingDto } from './dto/create-booking.dto';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../notifications/email.service';
import { User } from '../users/entities/user.entity';

// ─── Factories ───────────────────────────────────────────────────────────────

function makeService(overrides?: Partial<Service>): Service {
  return Object.assign(new Service(), {
    id: 'service-uuid',
    isActive: true,
    ...overrides,
  });
}

function makeSlot(overrides?: Partial<ScheduleSlot>): ScheduleSlot {
  return Object.assign(new ScheduleSlot(), {
    id: 'slot-uuid',
    serviceId: 'service-uuid',
    status: ScheduleSlotStatus.AVAILABLE,
    ...overrides,
  });
}

function makeBooking(overrides?: Partial<Booking>): Booking {
  return Object.assign(new Booking(), {
    id: 'booking-uuid',
    serviceId: 'service-uuid',
    slotId: 'slot-uuid',
    studentId: 'student-uuid',
    status: BookingStatus.CONFIRMED,
    cancelledAt: null,
    slot: makeSlot({ status: ScheduleSlotStatus.BOOKED }),
    ...overrides,
  });
}

/** Cria um QueryFailedError simulando violação de unique index Postgres (23505). */
function makePgUniqueError(): QueryFailedError {
  const err = new QueryFailedError('INSERT ...', [], new Error('unique')) as QueryFailedError & { code: string };
  err.code = '23505';
  return err;
}

// ─── Manager mock ────────────────────────────────────────────────────────────

function makeManager(overrides?: Partial<EntityManager>): Partial<EntityManager> {
  return {
    findOne: jest.fn(),
    save: jest.fn().mockImplementation((_entity: unknown, obj: unknown) =>
      Promise.resolve(obj),
    ),
    create: jest.fn().mockImplementation((_entity: unknown, data: unknown) => data),
    createQueryBuilder: jest.fn(),
    ...overrides,
  };
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('BookingsService', () => {
  let service: BookingsService;

  const mockBookingsRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    existsBy: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockServicesRepo = {
    existsBy: jest.fn(),
    findOneBy: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: getRepositoryToken(Booking), useValue: mockBookingsRepo },
        { provide: getRepositoryToken(Service), useValue: mockServicesRepo },
        { provide: getRepositoryToken(ScheduleSlot), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: DataSource, useValue: mockDataSource },
        { provide: PaymentsService, useValue: { createCheckoutSessionForBooking: jest.fn().mockResolvedValue({ checkoutUrl: 'url', paymentIntentId: 'pi' }) } },
        { provide: NotificationsService, useValue: { create: jest.fn() } },
        { provide: EmailService, useValue: { sendEmail: jest.fn() } },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    jest.clearAllMocks();
  });

  // ── createBooking ─────────────────────────────────────────────────────────

  describe('createBooking', () => {
    const dto: CreateBookingDto = {
      serviceId: 'service-uuid',
      slotId: 'slot-uuid',
      studentId: 'student-uuid',
    };

    function setupTransaction(manager: Partial<EntityManager>) {
      mockDataSource.transaction.mockImplementation(
        (cb: (m: EntityManager) => Promise<Booking>) =>
          cb(manager as EntityManager),
      );
    }

    function noActiveBookingQb() {
      return {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
    }

    it('cria booking com sucesso e marca slot como BOOKED', async () => {
      const slot = makeSlot();
      const manager = makeManager({
        findOne: jest.fn()
          .mockResolvedValueOnce(makeService())
          .mockResolvedValueOnce(slot),
        createQueryBuilder: jest.fn().mockReturnValue(noActiveBookingQb()),
      });
      setupTransaction(manager);

      const result = await service.createBooking(dto, 'student-uuid');

      // slot deve ter sido marcado como BOOKED antes de persistir
      expect(slot.status).toBe(ScheduleSlotStatus.BOOKED);
      expect(manager.save).toHaveBeenCalledWith(ScheduleSlot, slot);
      expect(result).toMatchObject({
        serviceId: dto.serviceId,
        slotId: dto.slotId,
        studentId: dto.studentId,
        status: BookingStatus.PENDING,
        cancelledAt: null,
      });
    });

    it('lança NotFoundException — service não encontrado ou inativo', async () => {
      const manager = makeManager({
        findOne: jest.fn().mockResolvedValueOnce(null),
      });
      setupTransaction(manager);

      await expect(service.createBooking(dto, 'student-uuid')).rejects.toThrow(NotFoundException);
    });

    it('lança NotFoundException — slot não encontrado', async () => {
      const manager = makeManager({
        findOne: jest.fn()
          .mockResolvedValueOnce(makeService())
          .mockResolvedValueOnce(null),
      });
      setupTransaction(manager);

      await expect(service.createBooking(dto, 'student-uuid')).rejects.toThrow(NotFoundException);
    });

    it('lança BadRequestException — slot pertence a outro service', async () => {
      const slot = makeSlot({ serviceId: 'outro-service' });
      const manager = makeManager({
        findOne: jest.fn()
          .mockResolvedValueOnce(makeService())
          .mockResolvedValueOnce(slot),
      });
      setupTransaction(manager);

      await expect(service.createBooking(dto, 'student-uuid')).rejects.toThrow(BadRequestException);
    });

    it('lança BadRequestException — slot não está AVAILABLE (ex.: BOOKED)', async () => {
      const slot = makeSlot({ status: ScheduleSlotStatus.BOOKED });
      const manager = makeManager({
        findOne: jest.fn()
          .mockResolvedValueOnce(makeService())
          .mockResolvedValueOnce(slot),
      });
      setupTransaction(manager);

      await expect(service.createBooking(dto, 'student-uuid')).rejects.toThrow(BadRequestException);
    });

    it('lança BadRequestException — slot não está AVAILABLE (ex.: BLOCKED)', async () => {
      const slot = makeSlot({ status: ScheduleSlotStatus.BLOCKED });
      const manager = makeManager({
        findOne: jest.fn()
          .mockResolvedValueOnce(makeService())
          .mockResolvedValueOnce(slot),
      });
      setupTransaction(manager);

      await expect(service.createBooking(dto, 'student-uuid')).rejects.toThrow(BadRequestException);
    });

    it('lança ConflictException — double-check detecta booking ativo existente (L3)', async () => {
      const slot = makeSlot();
      const existingBooking = makeBooking();
      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(existingBooking),
      };
      const manager = makeManager({
        findOne: jest.fn()
          .mockResolvedValueOnce(makeService())
          .mockResolvedValueOnce(slot),
        createQueryBuilder: jest.fn().mockReturnValue(qbMock),
      });
      setupTransaction(manager);

      await expect(service.createBooking(dto, 'student-uuid')).rejects.toThrow(ConflictException);
    });

    it('lança ConflictException — unique index Postgres 23505 (L4, race condition residual)', async () => {
      // Simula o cenário onde dois requests passam pelo lock e o segundo leva
      // violação do unique partial index UQ_bookings_slot_active.
      mockDataSource.transaction.mockRejectedValue(makePgUniqueError());

      await expect(service.createBooking(dto, 'student-uuid')).rejects.toThrow(ConflictException);
    });

    it('propaga erros desconhecidos sem mascarar', async () => {
      const unexpectedError = new Error('DB connection lost');
      mockDataSource.transaction.mockRejectedValue(unexpectedError);

      await expect(service.createBooking(dto, 'student-uuid')).rejects.toThrow('DB connection lost');
    });
  });

  // ── cancelBooking ─────────────────────────────────────────────────────────

  describe('cancelBooking', () => {
    function setupTransaction(manager: Partial<EntityManager>) {
      mockDataSource.transaction.mockImplementation(
        (cb: (m: EntityManager) => Promise<Booking>) =>
          cb(manager as EntityManager),
      );
    }

    it('cancela booking e devolve slot para AVAILABLE quando não há outro ativo', async () => {
      const slot = makeSlot({ status: ScheduleSlotStatus.BOOKED });
      const booking = makeBooking({ slot });

      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null), // sem outro ativo
      };
      const manager = makeManager({
        findOne: jest.fn().mockResolvedValue(booking),
        createQueryBuilder: jest.fn().mockReturnValue(qbMock),
      });
      setupTransaction(manager);

      const result = await service.cancelBooking('booking-uuid', { id: 'student-uuid' });

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(result.cancelledAt).toBeInstanceOf(Date);
      expect(slot.status).toBe(ScheduleSlotStatus.AVAILABLE);
      expect(manager.save).toHaveBeenCalledWith(ScheduleSlot, slot);
    });

    it('cancela booking mas NÃO devolve slot quando há outro booking ativo', async () => {
      const slot = makeSlot({ status: ScheduleSlotStatus.BOOKED });
      const booking = makeBooking({ slot });
      const otherBooking = makeBooking({ id: 'outro-booking', studentId: 'outro-student' });

      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(otherBooking),
      };
      const manager = makeManager({
        findOne: jest.fn().mockResolvedValue(booking),
        createQueryBuilder: jest.fn().mockReturnValue(qbMock),
      });
      setupTransaction(manager);

      await service.cancelBooking('booking-uuid', { id: 'student-uuid' });

      // slot NÃO deve ter sido salvo como AVAILABLE
      const slotSaveCalls = (manager.save as jest.Mock).mock.calls.filter(
        ([entity]) => entity === ScheduleSlot,
      );
      expect(slotSaveCalls).toHaveLength(0);
      expect(slot.status).toBe(ScheduleSlotStatus.BOOKED);
    });

    it('lança NotFoundException — booking não encontrado', async () => {
      const manager = makeManager({
        findOne: jest.fn().mockResolvedValue(null),
      });
      setupTransaction(manager);

      await expect(
        service.cancelBooking('nao-existe', { id: 'student-uuid' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lança ForbiddenException — studentId não é o dono', async () => {
      const booking = makeBooking({ studentId: 'outro-student' });
      const manager = makeManager({
        findOne: jest.fn().mockResolvedValue(booking),
      });
      setupTransaction(manager);

      await expect(
        service.cancelBooking('booking-uuid', { id: 'student-uuid' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lança BadRequestException — booking já está CANCELLED (idempotência)', async () => {
      const booking = makeBooking({
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
      });
      const manager = makeManager({
        findOne: jest.fn().mockResolvedValue(booking),
      });
      setupTransaction(manager);

      await expect(
        service.cancelBooking('booking-uuid', { id: 'student-uuid' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── listStudentBookings ───────────────────────────────────────────────────

  describe('listStudentBookings', () => {
    function makeQb(results: Booking[]) {
      return {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(results),
      };
    }

    it('retorna bookings do aluno sem filtro', async () => {
      const bookings = [makeBooking()];
      mockBookingsRepo.createQueryBuilder.mockReturnValue(makeQb(bookings));

      const result = await service.listStudentBookings('student-uuid');

      expect(result).toEqual(bookings);
    });

    it('aplica andWhere de status quando filtro informado', async () => {
      const qbMock = makeQb([]);
      mockBookingsRepo.createQueryBuilder.mockReturnValue(qbMock);

      await service.listStudentBookings('student-uuid', {
        status: BookingStatus.CANCELLED,
      });

      expect(qbMock.andWhere).toHaveBeenCalledWith(
        'booking.status = :status',
        { status: BookingStatus.CANCELLED },
      );
    });

    it('NÃO chama andWhere quando filtro ausente', async () => {
      const qbMock = makeQb([]);
      mockBookingsRepo.createQueryBuilder.mockReturnValue(qbMock);

      await service.listStudentBookings('student-uuid');

      expect(qbMock.andWhere).not.toHaveBeenCalled();
    });
  });

  // ── listServiceBookings ───────────────────────────────────────────────────

  describe('listServiceBookings', () => {
    function makeQb(results: Booking[]) {
      return {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(results),
      };
    }

    it('lança NotFoundException — service não existe', async () => {
      mockServicesRepo.existsBy.mockResolvedValue(false);

      await expect(
        service.listServiceBookings('nao-existe'),
      ).rejects.toThrow(NotFoundException);
    });

    it('retorna bookings do service sem filtro', async () => {
      const bookings = [makeBooking()];
      mockServicesRepo.findOneBy.mockResolvedValue({ providerId: 'provider-1' });
      mockBookingsRepo.createQueryBuilder.mockReturnValue(makeQb(bookings));

      const result = await service.listServiceBookings('service-uuid', 'provider-1');

      expect(result).toEqual(bookings);
    });

    it('aplica andWhere de status quando filtro informado', async () => {
      mockServicesRepo.findOneBy.mockResolvedValue({ providerId: 'provider-1' });
      const qbMock = makeQb([]);
      mockBookingsRepo.createQueryBuilder.mockReturnValue(qbMock);

      await service.listServiceBookings('service-uuid', 'provider-1', {
        status: BookingStatus.CONFIRMED,
      });

      expect(qbMock.andWhere).toHaveBeenCalledWith(
        'booking.status = :status',
        { status: BookingStatus.CONFIRMED },
      );
    });
  });
});
