import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { User } from '../users/entities/user.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ReviewsService', () => {
  let service: ReviewsService;

  const mockReviewRepo = {};
  const mockUserRepo = {};
  const mockBookingRepo = {};

  const mockManager = {
    findOne: jest.fn(),
    create: jest.fn().mockImplementation((entity, dto) => dto),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn().mockImplementation(async (cb) => cb(mockManager)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getRepositoryToken(Review), useValue: mockReviewRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Booking), useValue: mockBookingRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReview', () => {
    it('should throw NotFoundException if booking not found', async () => {
      mockManager.findOne.mockResolvedValueOnce(null);
      await expect(service.createReview({ bookingId: 'b1', rating: 5, comment: '' }, 's1'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if student is not owner', async () => {
      mockManager.findOne.mockResolvedValueOnce({ id: 'b1', studentId: 'other' });
      await expect(service.createReview({ bookingId: 'b1', rating: 5, comment: '' }, 's1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if booking is not CONFIRMED', async () => {
      mockManager.findOne.mockResolvedValueOnce({ id: 'b1', studentId: 's1', status: BookingStatus.PENDING });
      await expect(service.createReview({ bookingId: 'b1', rating: 5, comment: '' }, 's1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if review already exists', async () => {
      mockManager.findOne
        .mockResolvedValueOnce({ id: 'b1', studentId: 's1', status: BookingStatus.CONFIRMED }) // Booking
        .mockResolvedValueOnce({ id: 'r1' }); // Review

      await expect(service.createReview({ bookingId: 'b1', rating: 5, comment: '' }, 's1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should create review and update provider rating', async () => {
      mockManager.findOne
        .mockResolvedValueOnce({ id: 'b1', studentId: 's1', status: BookingStatus.CONFIRMED, service: { providerId: 'p1' } }) // Booking
        .mockResolvedValueOnce(null); // Review
      
      const qb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ averageRating: '4.5', totalReviews: '2' }),
      };
      mockManager.createQueryBuilder.mockReturnValue(qb);

      const result = await service.createReview({ bookingId: 'b1', rating: 5, comment: 'ok' }, 's1');
      
      expect(mockManager.save).toHaveBeenCalled();
      expect(mockManager.update).toHaveBeenCalledWith(User, { id: 'p1' }, { averageRating: 4.5, totalReviews: 2 });
      expect(result.rating).toBe(5);
    });
  });
});
