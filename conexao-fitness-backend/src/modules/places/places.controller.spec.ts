import { Test, TestingModule } from '@nestjs/testing';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';

describe('PlacesController', () => {
  let controller: PlacesController;
  let service: PlacesService;

  const mockPlacesService = {
    getGyms: jest.fn(),
    indicateGym: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlacesController],
      providers: [
        {
          provide: PlacesService,
          useValue: mockPlacesService,
        },
      ],
    }).compile();

    controller = module.get<PlacesController>(PlacesController);
    service = module.get<PlacesService>(PlacesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getGyms', () => {
    it('should forward parameters and client IP to service', async () => {
      mockPlacesService.getGyms.mockResolvedValue({
        items: [],
        source: 'GOOGLE_PLACES_API',
        cityFilter: 'Santa Maria',
      });

      const req: any = {
        headers: { 'x-forwarded-for': '203.0.113.195' },
        socket: {},
      };

      const res = await controller.getGyms(
        { city: 'Santa Maria' },
        { id: 'user_1' },
        req,
      );

      expect(mockPlacesService.getGyms).toHaveBeenCalledWith(
        { city: 'Santa Maria' },
        'user_1',
        '203.0.113.195',
      );
      expect(res.cityFilter).toBe('Santa Maria');
    });
  });

  describe('indicateGym', () => {
    it('should forward placeId and payload to service', async () => {
      mockPlacesService.indicateGym.mockResolvedValue({
        success: true,
        message: 'Indicação registrada com sucesso!',
        totalIndications: 3,
      });

      const req: any = {
        headers: {},
        socket: { remoteAddress: '192.168.1.50' },
      };

      const res = await controller.indicateGym(
        'place_123',
        { gymName: 'Academia XYZ', city: 'Santa Maria' },
        { id: 'user_1' },
        req,
      );

      expect(mockPlacesService.indicateGym).toHaveBeenCalledWith(
        'place_123',
        { gymName: 'Academia XYZ', city: 'Santa Maria' },
        'user_1',
        '192.168.1.50',
      );
      expect(res.success).toBe(true);
    });
  });
});
