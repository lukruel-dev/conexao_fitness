import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ConflictException } from '@nestjs/common';
import { PlacesService } from './places.service';
import { GymIndication } from './entities/gym-indication.entity';
import { AcademiaProfile } from '../users/entities/academia-profile.entity';
import { User } from '../users/entities/user.entity';

describe('PlacesService', () => {
  let service: PlacesService;
  let indicationRepo: any;
  let academiaProfileRepo: any;
  let userRepo: any;
  let configService: any;

  const mockAcademiaQB = {
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };

  const mockIndicationQB = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
    getMany: jest.fn().mockResolvedValue([]),
  };

  const mockIndicationRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockIndicationQB),
  };

  const mockAcademiaProfileRepo = {
    find: jest.fn().mockResolvedValue([]),
    createQueryBuilder: jest.fn().mockReturnValue(mockAcademiaQB),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(null), // simulate fallback local gyms (no external API call during unit test)
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlacesService,
        {
          provide: getRepositoryToken(GymIndication),
          useValue: mockIndicationRepo,
        },
        {
          provide: getRepositoryToken(AcademiaProfile),
          useValue: mockAcademiaProfileRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PlacesService>(PlacesService);
    indicationRepo = module.get(getRepositoryToken(GymIndication));
    academiaProfileRepo = module.get(getRepositoryToken(AcademiaProfile));
    userRepo = module.get(getRepositoryToken(User));
    configService = module.get(ConfigService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGyms', () => {
    it('should return gyms filtered by city and distinguish non-partners from partners', async () => {
      mockAcademiaQB.getMany.mockResolvedValue([
        {
          googlePlaceId: 'place_sm_corpo_acao',
          userId: 'user_gym_partner_1',
          dayPassPrice: 25.0,
          nomeFantasia: 'Corpo & Ação Santa Maria - Parceira Finex',
          coverUrl: 'https://example.com/cover.jpg',
        },
      ]);

      mockIndicationQB.getRawMany.mockResolvedValue([
        { placeId: 'place_sm_smartfit', count: '2' },
      ]);

      mockIndicationQB.getMany.mockResolvedValue([
        { placeId: 'place_sm_smartfit', userId: 'user_123' },
      ]);

      const result = await service.getGyms(
        { city: 'Santa Maria' },
        'user_123',
        '127.0.0.1',
      );

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.cityFilter).toBe('Santa Maria');

      // Partner matching
      const partnerGym = result.items.find(g => g.placeId === 'place_sm_corpo_acao');
      expect(partnerGym).toBeDefined();
      expect(partnerGym?.isPartner).toBe(true);
      expect(partnerGym?.partnerId).toBe('user_gym_partner_1');
      expect(partnerGym?.partnerDayPassPrice).toBe(25.0);

      // Non-partner gym with indications
      const nonPartnerGym = result.items.find(g => g.placeId === 'place_sm_smartfit');
      expect(nonPartnerGym).toBeDefined();
      expect(nonPartnerGym?.isPartner).toBe(false);
      expect(nonPartnerGym?.indicationCount).toBe(2);
      expect(nonPartnerGym?.userAlreadyIndicated).toBe(true);
    });

    it('should prompt when searching for another city like São Paulo', async () => {
      mockAcademiaProfileRepo.find.mockResolvedValue([]);
      mockIndicationRepo.find.mockResolvedValue([]);

      const result = await service.getGyms(
        { city: 'São Paulo' },
        'user_123',
        '127.0.0.1',
      );

      expect(result.cityFilter).toBe('São Paulo');
      expect(result.items.every(g => g.city.toLowerCase().includes('são paulo'))).toBe(true);
    });
  });

  describe('indicateGym', () => {
    it('should record indication and increment count', async () => {
      mockIndicationRepo.findOne.mockResolvedValue(null);
      mockIndicationRepo.create.mockReturnValue({
        placeId: 'place_test_1',
        gymName: 'Academia Teste',
        userId: 'user_1',
      });
      mockIndicationRepo.save.mockResolvedValue({ id: 'ind_1' });
      mockIndicationRepo.count.mockResolvedValue(5);

      const res = await service.indicateGym(
        'place_test_1',
        { gymName: 'Academia Teste', city: 'Santa Maria' },
        'user_1',
        '127.0.0.1',
      );

      expect(res.success).toBe(true);
      expect(res.totalIndications).toBe(5);
      expect(mockIndicationRepo.save).toHaveBeenCalled();
    });

    it('should prevent duplicate votes from the same user', async () => {
      mockIndicationRepo.findOne.mockResolvedValue({ id: 'existing_ind' });

      await expect(
        service.indicateGym(
          'place_test_1',
          { gymName: 'Academia Teste' },
          'user_1',
          '127.0.0.1',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should prevent duplicate votes from the same IP when unauthenticated', async () => {
      mockIndicationRepo.findOne.mockResolvedValue({ id: 'existing_ind' });

      await expect(
        service.indicateGym(
          'place_test_1',
          { gymName: 'Academia Teste' },
          undefined,
          '192.168.1.100',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
