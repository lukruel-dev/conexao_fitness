import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

describe('SearchController', () => {
  let controller: SearchController;

  const mockSearchService = {
    searchServices: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        { provide: SearchService, useValue: mockSearchService },
      ],
    }).compile();

    controller = module.get<SearchController>(SearchController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchServices', () => {
    it('should call searchService.searchServices', async () => {
      mockSearchService.searchServices.mockResolvedValue([{ id: 's1' }]);
      const result = await controller.searchServices({ lat: -30, lng: -50 } as any);
      expect(result).toEqual([{ id: 's1' }]);
      expect(mockSearchService.searchServices).toHaveBeenCalledWith({ lat: -30, lng: -50 });
    });
  });
});
