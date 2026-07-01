import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { ForbiddenException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';

describe('BookingsController', () => {
  let controller: BookingsController;
  let service: BookingsService;

  const mockBookingsService = {
    createBooking: jest.fn(),
    cancelBooking: jest.fn(),
    listStudentBookings: jest.fn(),
    listServiceBookings: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        {
          provide: BookingsService,
          useValue: mockBookingsService,
        },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    service = module.get<BookingsService>(BookingsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call BookingsService.createBooking', async () => {
      const dto: CreateBookingDto = { serviceId: 'service-1', slotId: 'slot-1', studentId: 'student-1' };
      mockBookingsService.createBooking.mockResolvedValue({ id: 'booking-1' });

      const result = await controller.create(dto, { id: 'student-1' });
      expect(result).toEqual({ id: 'booking-1' });
      expect(mockBookingsService.createBooking).toHaveBeenCalledWith(dto, 'student-1');
    });
  });

  describe('cancel', () => {
    it('should throw ForbiddenException if body.studentId differs from user.id and not ADMIN', async () => {
      expect(() => 
        controller.cancel('booking-1', { studentId: 'other-student' }, { id: 'student-1', role: 'STUDENT' }),
      ).toThrow(ForbiddenException);
    });

    it('should allow ADMIN to cancel for any student', async () => {
      mockBookingsService.cancelBooking.mockResolvedValue({ id: 'booking-1' });
      
      const result = await controller.cancel('booking-1', { studentId: 'other-student' }, { id: 'admin-1', role: 'ADMIN' });
      expect(result).toEqual({ id: 'booking-1' });
      expect(mockBookingsService.cancelBooking).toHaveBeenCalledWith('booking-1', { id: 'admin-1', role: 'ADMIN' });
    });

    it('should call BookingsService.cancelBooking if valid', async () => {
      mockBookingsService.cancelBooking.mockResolvedValue({ id: 'booking-1' });
      
      const result = await controller.cancel('booking-1', { studentId: 'student-1' }, { id: 'student-1', role: 'STUDENT' });
      expect(result).toEqual({ id: 'booking-1' });
      expect(mockBookingsService.cancelBooking).toHaveBeenCalledWith('booking-1', { id: 'student-1', role: 'STUDENT' });
    });
  });

  describe('findByStudent', () => {
    it('should throw ForbiddenException if studentId differs from user.id and not ADMIN', async () => {
      expect(() => 
        controller.findByStudent('other-student', {}, { id: 'student-1', role: 'STUDENT' }),
      ).toThrow(ForbiddenException);
    });

    it('should call listStudentBookings', async () => {
      mockBookingsService.listStudentBookings.mockResolvedValue([{ id: 'booking-1' }]);
      
      const result = await controller.findByStudent('student-1', {}, { id: 'student-1', role: 'STUDENT' });
      expect(result).toEqual([{ id: 'booking-1' }]);
      expect(mockBookingsService.listStudentBookings).toHaveBeenCalledWith('student-1', {});
    });
  });

  describe('findByService', () => {
    it('should call listServiceBookings', async () => {
      mockBookingsService.listServiceBookings.mockResolvedValue([{ id: 'booking-1' }]);
      
      const result = await controller.findByService('service-1', {}, { id: 'provider-1', role: 'PERSONAL' });
      expect(result).toEqual([{ id: 'booking-1' }]);
      expect(mockBookingsService.listServiceBookings).toHaveBeenCalledWith('service-1', 'provider-1', {});
    });
  });
});
