import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { ForbiddenException } from '@nestjs/common';

describe('AvailabilityController', () => {
  let controller: AvailabilityController;
  let service: AvailabilityService;

  const mockService = {
    getAvailability: jest.fn(),
    updateAvailability: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvailabilityController],
      providers: [
        { provide: AvailabilityService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<AvailabilityController>(AvailabilityController);
    service = module.get<AvailabilityService>(AvailabilityService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyAvailability', () => {
    it('should throw ForbiddenException if user is STUDENT', async () => {
      await expect(controller.getMyAvailability({ role: 'STUDENT' })).rejects.toThrow(ForbiddenException);
    });

    it('should call getAvailability if user is a provider', async () => {
      mockService.getAvailability.mockResolvedValue([{ id: 'a1' }]);
      const result = await controller.getMyAvailability({ id: 'p1', role: 'PERSONAL' });
      expect(result).toEqual([{ id: 'a1' }]);
      expect(mockService.getAvailability).toHaveBeenCalledWith('p1');
    });
  });

  describe('updateMyAvailability', () => {
    it('should throw ForbiddenException if user is STUDENT', async () => {
      await expect(controller.updateMyAvailability({ role: 'STUDENT' }, { availabilities: [] })).rejects.toThrow(ForbiddenException);
    });

    it('should call updateAvailability if user is a provider', async () => {
      mockService.updateAvailability.mockResolvedValue([{ id: 'a1' }]);
      const result = await controller.updateMyAvailability({ id: 'p1', role: 'PERSONAL' }, { availabilities: [] });
      expect(result).toEqual([{ id: 'a1' }]);
      expect(mockService.updateAvailability).toHaveBeenCalledWith('p1', { availabilities: [] });
    });
  });
});
