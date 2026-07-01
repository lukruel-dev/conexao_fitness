import { Test, TestingModule } from '@nestjs/testing';
import { QRService } from './qr.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QRCharge } from './entities/qr-charge.entity';

describe('QRService', () => {
  let service: QRService;

  const mockQrRepo = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockImplementation(dto => ({ id: 'qr1', ...dto })),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QRService,
        { provide: getRepositoryToken(QRCharge), useValue: mockQrRepo },
      ],
    }).compile();

    service = module.get<QRService>(QRService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createQrCharge', () => {
    it('should create QR charge with expiration', async () => {
      const dto = { amount: 50.00, description: 'Desc', expiresInMinutes: 10 };
      const result = await service.createQrCharge('p1', dto);
      expect(result.qr_charge_id).toBe('qr1');
      expect(result.expires_at).toBeDefined();
      expect(mockQrRepo.save).toHaveBeenCalled();
    });

    it('should create QR charge without expiration', async () => {
      const dto = { amount: 50.00, description: 'Desc' };
      const result = await service.createQrCharge('p1', dto);
      expect(result.expires_at).toBeNull();
    });
  });

  describe('getQrCharge', () => {
    it('should return null if not found', async () => {
      mockQrRepo.findOne.mockResolvedValue(null);
      const result = await service.getQrCharge('qr1');
      expect(result).toBeNull();
    });

    it('should return charge data', async () => {
      mockQrRepo.findOne.mockResolvedValue({ id: 'qr1', amount: '50.00', currency: 'BRL' });
      const result = await service.getQrCharge('qr1');
      expect(result.qr_charge_id).toBe('qr1');
      expect(result.amount).toBe(50);
    });
  });

  describe('markAsPaid', () => {
    it('should throw error if invalid or not pending', async () => {
      mockQrRepo.findOne.mockResolvedValue(null);
      await expect(service.markAsPaid('qr1')).rejects.toThrow('QRCharge inválido ou já processado');
      
      mockQrRepo.findOne.mockResolvedValue({ id: 'qr1', status: 'PAID' });
      await expect(service.markAsPaid('qr1')).rejects.toThrow('QRCharge inválido ou já processado');
    });

    it('should mark as paid and save', async () => {
      mockQrRepo.findOne.mockResolvedValue({ id: 'qr1', status: 'PENDING' });
      const result = await service.markAsPaid('qr1');
      expect(mockQrRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'PAID' }));
    });
  });
});
