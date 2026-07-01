import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../notifications/email.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ChatService', () => {
  let service: ChatService;

  const mockMessageRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation(async (msg) => ({ id: 'msg-1', ...msg })),
    find: jest.fn(),
  };

  const mockBookingRepo = {
    findOne: jest.fn(),
  };

  const mockUserRepo = {
    findOneBy: jest.fn(),
  };

  const mockNotificationsService = {
    create: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  beforeEach(async () => {

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getRepositoryToken(Message), useValue: mockMessageRepo },
        { provide: getRepositoryToken(Booking), useValue: mockBookingRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should throw NotFoundException if booking not found', async () => {
      mockBookingRepo.findOne.mockResolvedValue(null);
      await expect(service.sendMessage('b1', 'u1', 'hello')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not part of booking', async () => {
      mockBookingRepo.findOne.mockResolvedValue({
        id: 'b1',
        studentId: 's1',
        service: { providerId: 'p1' },
      });
      await expect(service.sendMessage('b1', 'u1', 'hello')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if booking is not confirmed', async () => {
      mockBookingRepo.findOne.mockResolvedValue({
        id: 'b1',
        studentId: 's1',
        status: BookingStatus.PENDING,
        service: { providerId: 'p1' },
      });
      await expect(service.sendMessage('b1', 's1', 'hello')).rejects.toThrow(ForbiddenException);
    });

    it('should save message and trigger notifications', async () => {
      mockBookingRepo.findOne.mockResolvedValue({
        id: 'b1',
        studentId: 's1',
        status: BookingStatus.CONFIRMED,
        service: { providerId: 'p1', name: 'Treino' },
      });
      
      mockUserRepo.findOneBy.mockImplementation(async ({ id }) => ({
        id,
        name: id === 's1' ? 'Student' : 'Provider',
        email: id === 's1' ? 'student@email.com' : 'provider@email.com',
      }));

      const result = await service.sendMessage('b1', 's1', 'hello');
      
      expect(result).toMatchObject({
        bookingId: 'b1',
        senderId: 's1',
        content: 'hello',
      });
      
      expect(mockMessageRepo.save).toHaveBeenCalled();

      // Wait for setTimeout to execute and its inner promises to resolve
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockNotificationsService.create).toHaveBeenCalled();
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
    });

    it('should filter blocked keywords (PIX, phone, etc)', async () => {
      mockBookingRepo.findOne.mockResolvedValue({
        id: 'b1',
        studentId: 's1',
        status: BookingStatus.CONFIRMED,
        service: { providerId: 'p1' },
      });

      const result = await service.sendMessage('b1', 's1', 'manda um PIX para 999999999');
      expect(result.content).toBe('manda um [BLOQUEADO PELO SISTEMA] para [BLOQUEADO PELO SISTEMA]');
    });
  });

  describe('getMessages', () => {
    it('should throw NotFoundException if booking not found', async () => {
      mockBookingRepo.findOne.mockResolvedValue(null);
      await expect(service.getMessages('b1', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not part of booking', async () => {
      mockBookingRepo.findOne.mockResolvedValue({
        id: 'b1',
        studentId: 's1',
        service: { providerId: 'p1' },
      });
      await expect(service.getMessages('b1', 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('should return messages', async () => {
      mockBookingRepo.findOne.mockResolvedValue({
        id: 'b1',
        studentId: 's1',
        service: { providerId: 'p1' },
      });
      mockMessageRepo.find.mockResolvedValue([{ id: 'msg-1' }]);

      const result = await service.getMessages('b1', 's1');
      expect(result).toEqual([{ id: 'msg-1' }]);
      expect(mockMessageRepo.find).toHaveBeenCalledWith({
        where: { bookingId: 'b1' },
        order: { createdAt: 'ASC' },
      });
    });
  });
});
