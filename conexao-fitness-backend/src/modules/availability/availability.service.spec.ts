import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityService } from './availability.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProviderAvailability } from './entities/provider-availability.entity';
import { BadRequestException } from '@nestjs/common';

describe('AvailabilityService', () => {
  let service: AvailabilityService;

  const mockRepo = {
    find: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        { provide: getRepositoryToken(ProviderAvailability), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<AvailabilityService>(AvailabilityService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAvailability', () => {
    it('should return availability', async () => {
      mockRepo.find.mockResolvedValue([{ id: 'a1' }]);
      const result = await service.getAvailability('p1');
      expect(result).toEqual([{ id: 'a1' }]);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { providerId: 'p1' },
        order: { dayOfWeek: 'ASC', startTime: 'ASC' },
      });
    });
  });

  describe('updateAvailability', () => {
    it('should throw BadRequestException if startTime format invalid', async () => {
      await expect(service.updateAvailability('p1', {
        availabilities: [{ dayOfWeek: 1, startTime: 'invalid', endTime: '10:00' }],
      })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if endTime format invalid', async () => {
      await expect(service.updateAvailability('p1', {
        availabilities: [{ dayOfWeek: 1, startTime: '08:00', endTime: 'invalid' }],
      })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if startTime >= endTime', async () => {
      await expect(service.updateAvailability('p1', {
        availabilities: [{ dayOfWeek: 1, startTime: '10:00', endTime: '08:00' }],
      })).rejects.toThrow(BadRequestException);
    });

    it('should delete old blocks and save new ones', async () => {
      mockRepo.find.mockResolvedValue([{ dayOfWeek: 1, startTime: '08:00', endTime: '10:00' }]);
      
      const result = await service.updateAvailability('p1', {
        availabilities: [{ dayOfWeek: 1, startTime: '08:00', endTime: '10:00' }],
      });
      
      expect(mockRepo.delete).toHaveBeenCalledWith({ providerId: 'p1' });
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should not call save if array is empty', async () => {
      mockRepo.find.mockResolvedValue([]);
      
      await service.updateAvailability('p1', { availabilities: [] });
      
      expect(mockRepo.delete).toHaveBeenCalledWith({ providerId: 'p1' });
      expect(mockRepo.save).not.toHaveBeenCalled();
    });
  });
});
