import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { Service } from '../services/entities/service.entity';
import { Subscription } from '../payments/entities/subscription.entity';
import { NotFoundException } from '@nestjs/common';

describe('AdminService', () => {
  let service: AdminService;

  const makeQb = (results = []) => ({
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(results),
  });

  const mockUsersRepo = {
    findOne: jest.fn(),
    save: jest.fn().mockImplementation(u => u),
    count: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(makeQb()),
  };
  const mockBookingsRepo = {
    count: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(makeQb()),
  };
  const mockServicesRepo = {
    count: jest.fn(),
  };
  const mockSubscriptionsRepo = {
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(User), useValue: mockUsersRepo },
        { provide: getRepositoryToken(Booking), useValue: mockBookingsRepo },
        { provide: getRepositoryToken(Service), useValue: mockServicesRepo },
        { provide: getRepositoryToken(Subscription), useValue: mockSubscriptionsRepo },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('approveKyc', () => {
    it('should approve user', async () => {
      mockUsersRepo.findOne.mockResolvedValue({ id: 'u1', status: 'PENDENTE_KYC' });
      const result = await service.approveKyc('u1');
      expect(result.status).toBe('ATIVO');
      expect(mockUsersRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);
      await expect(service.approveKyc('u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('rejectKyc', () => {
    it('should reject user', async () => {
      mockUsersRepo.findOne.mockResolvedValue({ id: 'u1', status: 'PENDENTE_KYC' });
      const result = await service.rejectKyc('u1', 'reason');
      expect(result.status).toBe('PENDENTE_KYC');
      expect(mockUsersRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);
      await expect(service.rejectKyc('u1', 'reason')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDashboardMetrics', () => {
    it('should return metrics', async () => {
      mockUsersRepo.count.mockResolvedValue(10);
      mockSubscriptionsRepo.count.mockResolvedValue(5);
      mockBookingsRepo.count.mockResolvedValue(20);
      mockServicesRepo.count.mockResolvedValue(15);

      const result = await service.getDashboardMetrics();
      expect(result).toEqual({
        totalUsers: 10,
        activeSubscriptions: 5,
        totalBookings: 20,
        totalServices: 15,
      });
    });
  });

  describe('findAllUsers', () => {
    it('should apply filters and return users', async () => {
      const qb = makeQb([{ id: 'u1' }]);
      mockUsersRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAllUsers('STUDENT' as UserRole, 'ATIVO' as UserStatus);
      expect(result).toEqual([{ id: 'u1' }]);
      expect(qb.andWhere).toHaveBeenCalledWith('user.role = :role', { role: 'STUDENT' });
      expect(qb.andWhere).toHaveBeenCalledWith('user.status = :status', { status: 'ATIVO' });
    });
  });

  describe('findAllBookings', () => {
    it('should apply filters and return bookings', async () => {
      const qb = makeQb([{ id: 'b1' }]);
      mockBookingsRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAllBookings(BookingStatus.CONFIRMED);
      expect(result).toEqual([{ id: 'b1' }]);
      expect(qb.andWhere).toHaveBeenCalledWith('booking.status = :status', { status: BookingStatus.CONFIRMED });
    });
  });

  describe('suspendUser', () => {
    it('should suspend user', async () => {
      mockUsersRepo.findOne.mockResolvedValue({ id: 'u1', status: 'ATIVO' });
      const result = await service.suspendUser('u1');
      expect(result.status).toBe('SUSPENSO');
      expect(mockUsersRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);
      await expect(service.suspendUser('u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('activateUser', () => {
    it('should activate user', async () => {
      mockUsersRepo.findOne.mockResolvedValue({ id: 'u1', status: 'SUSPENSO' });
      const result = await service.activateUser('u1');
      expect(result.status).toBe('ATIVO');
      expect(mockUsersRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);
      await expect(service.activateUser('u1')).rejects.toThrow(NotFoundException);
    });
  });
});
