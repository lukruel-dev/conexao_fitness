import { Test, TestingModule } from '@nestjs/testing';
import { QRController } from './qr.controller';
import { QRService } from './qr.service';

describe('QRController', () => {
  let controller: QRController;

  const mockQrService = {
    createQrCharge: jest.fn(),
    getQrCharge: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QRController],
      providers: [
        { provide: QRService, useValue: mockQrService },
      ],
    }).compile();

    controller = module.get<QRController>(QRController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createQrCharge', () => {
    it('should call createQrCharge with fakeProviderId', async () => {
      mockQrService.createQrCharge.mockResolvedValue({ qr_charge_id: 'qr1' });
      const result = await controller.createQrCharge({ amount: 50, description: 'Test' });
      expect(result).toEqual({ qr_charge_id: 'qr1' });
      expect(mockQrService.createQrCharge).toHaveBeenCalledWith('provider_fake_1', { amount: 50, description: 'Test' });
    });
  });

  describe('getQrCharge', () => {
    it('should return error if not found', async () => {
      mockQrService.getQrCharge.mockResolvedValue(null);
      const result = await controller.getQrCharge('qr1');
      expect(result).toEqual({ error: 'QRCharge not found' });
    });

    it('should return data if found', async () => {
      mockQrService.getQrCharge.mockResolvedValue({ qr_charge_id: 'qr1' });
      const result = await controller.getQrCharge('qr1');
      expect(result).toEqual({ qr_charge_id: 'qr1' });
    });
  });
});
