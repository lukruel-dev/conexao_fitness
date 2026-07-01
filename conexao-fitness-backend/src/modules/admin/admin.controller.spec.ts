import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UserRole, UserStatus } from '../users/entities/user.entity';
import { BookingStatus } from '../bookings/entities/booking.entity';

describe('AdminController', () => {
  let controller: AdminController;

  const mockAdminService = {
    approveKyc: jest.fn(),
    rejectKyc: jest.fn(),
    getDashboardMetrics: jest.fn(),
    findAllUsers: jest.fn(),
    findAllBookings: jest.fn(),
    suspendUser: jest.fn(),
    activateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('approveKyc', () => {
    it('should call adminService.approveKyc', async () => {
      mockAdminService.approveKyc.mockResolvedValue({ id: 'u1' });
      const result = await controller.approveKyc('u1');
      expect(result).toEqual({ id: 'u1' });
      expect(mockAdminService.approveKyc).toHaveBeenCalledWith('u1');
    });
  });

  describe('rejectKyc', () => {
    it('should call adminService.rejectKyc', async () => {
      mockAdminService.rejectKyc.mockResolvedValue({ id: 'u1' });
      const result = await controller.rejectKyc('u1', 'reason');
      expect(result).toEqual({ id: 'u1' });
      expect(mockAdminService.rejectKyc).toHaveBeenCalledWith('u1', 'reason');
    });

    it('should use default reason if not provided', async () => {
      mockAdminService.rejectKyc.mockResolvedValue({ id: 'u1' });
      await controller.rejectKyc('u1', '');
      expect(mockAdminService.rejectKyc).toHaveBeenCalledWith('u1', 'Documentação inválida');
    });
  });

  describe('getDashboardMetrics', () => {
    it('should call adminService.getDashboardMetrics', async () => {
      mockAdminService.getDashboardMetrics.mockResolvedValue({ totalUsers: 10 });
      const result = await controller.getDashboardMetrics();
      expect(result).toEqual({ totalUsers: 10 });
      expect(mockAdminService.getDashboardMetrics).toHaveBeenCalled();
    });
  });

  describe('findAllUsers', () => {
    it('should call adminService.findAllUsers', async () => {
      mockAdminService.findAllUsers.mockResolvedValue([{ id: 'u1' }]);
      const result = await controller.findAllUsers('STUDENT', 'ATIVO');
      expect(result).toEqual([{ id: 'u1' }]);
      expect(mockAdminService.findAllUsers).toHaveBeenCalledWith('STUDENT' as UserRole, 'ATIVO' as UserStatus);
    });
  });

  describe('findAllBookings', () => {
    it('should call adminService.findAllBookings', async () => {
      mockAdminService.findAllBookings.mockResolvedValue([{ id: 'b1' }]);
      const result = await controller.findAllBookings('CONFIRMED');
      expect(result).toEqual([{ id: 'b1' }]);
      expect(mockAdminService.findAllBookings).toHaveBeenCalledWith(BookingStatus.CONFIRMED);
    });
  });

  describe('suspendUser', () => {
    it('should call adminService.suspendUser', async () => {
      mockAdminService.suspendUser.mockResolvedValue({ id: 'u1' });
      const result = await controller.suspendUser('u1');
      expect(result).toEqual({ id: 'u1' });
      expect(mockAdminService.suspendUser).toHaveBeenCalledWith('u1');
    });
  });

  describe('activateUser', () => {
    it('should call adminService.activateUser', async () => {
      mockAdminService.activateUser.mockResolvedValue({ id: 'u1' });
      const result = await controller.activateUser('u1');
      expect(result).toEqual({ id: 'u1' });
      expect(mockAdminService.activateUser).toHaveBeenCalledWith('u1');
    });
  });
});
