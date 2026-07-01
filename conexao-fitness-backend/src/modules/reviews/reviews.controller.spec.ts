import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

describe('ReviewsController', () => {
  let controller: ReviewsController;

  const mockService = {
    createReview: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        { provide: ReviewsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<ReviewsController>(ReviewsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createReview', () => {
    it('should call service.createReview', async () => {
      mockService.createReview.mockResolvedValue({ id: 'r1' });
      const result = await controller.createReview({ bookingId: 'b1', rating: 5, comment: 'ok' }, { id: 'u1' });
      expect(result).toEqual({ id: 'r1' });
      expect(mockService.createReview).toHaveBeenCalledWith({ bookingId: 'b1', rating: 5, comment: 'ok' }, 'u1');
    });
  });
});
