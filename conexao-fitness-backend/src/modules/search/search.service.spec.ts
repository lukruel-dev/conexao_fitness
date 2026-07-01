import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Service } from '../services/entities/service.entity';
import { ConfigService } from '@nestjs/config';

describe('SearchService', () => {
  let service: SearchService;

  const mockQb = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawAndEntities: jest.fn(),
  };

  const mockServicesRepo = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQb),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('Uruguaiana'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: getRepositoryToken(Service), useValue: mockServicesRepo },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchServices', () => {
    it('should build query and return results', async () => {
      mockQb.getRawAndEntities.mockResolvedValue({
        entities: [{ id: 's1' }],
        raw: [{ distance_km: '10.5', ranking_score: '150.0' }],
      });

      const result = await service.searchServices({
        lat: -30,
        lng: -57,
        radiusKm: 50,
        modality: 'Treino',
        maxPrice: 100,
        providerType: 'PERSONAL',
        targetCity: 'Uruguaiana',
      });

      expect(mockServicesRepo.createQueryBuilder).toHaveBeenCalledWith('service');
      expect(mockQb.andWhere).toHaveBeenCalledWith('service.modality ILIKE :modality', { modality: '%Treino%' });
      expect(mockQb.andWhere).toHaveBeenCalledWith('service.price <= :maxPrice', { maxPrice: 100 });
      expect(mockQb.andWhere).toHaveBeenCalledWith('service.providerType = :providerType', { providerType: 'PERSONAL' });
      expect(mockQb.andWhere).toHaveBeenCalledWith('provider.cityBase ILIKE :targetCity', { targetCity: '%Uruguaiana%' });
      
      expect(result).toHaveLength(1);
      expect(result[0].distanceKm).toBe('10.50');
      expect(result[0].rankingScore).toBe('150.00');
    });
  });
});
