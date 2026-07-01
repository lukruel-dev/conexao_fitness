import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WalletAccount } from './entities/wallet-account.entity';
import { PaymentIntent } from './entities/payment-intent.entity';
import { QRService } from '../qr/qr.service';

describe('WalletService', () => {
  let service: WalletService;

  const mockWalletRepo = {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockImplementation(dto => ({ id: 'w1', ...dto })),
  };

  const mockPaymentIntentRepo = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockImplementation(dto => ({ id: 'pi1', ...dto })),
    findOne: jest.fn(),
  };

  const mockQrService = {
    getQrCharge: jest.fn(),
    markAsPaid: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: getRepositoryToken(WalletAccount), useValue: mockWalletRepo },
        { provide: getRepositoryToken(PaymentIntent), useValue: mockPaymentIntentRepo },
        { provide: QRService, useValue: mockQrService },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMyBalance', () => {
    it('should create wallet if not exists', async () => {
      mockWalletRepo.findOne.mockResolvedValue(null);
      
      const result = await service.getMyBalance('u1');
      expect(mockWalletRepo.create).toHaveBeenCalled();
      expect(mockWalletRepo.save).toHaveBeenCalled();
      expect(result.current_balance).toBe(0);
    });

    it('should return existing wallet balance', async () => {
      mockWalletRepo.findOne.mockResolvedValue({ id: 'w1', currency: 'BRL', currentBalance: '100.50' });
      
      const result = await service.getMyBalance('u1');
      expect(mockWalletRepo.create).not.toHaveBeenCalled();
      expect(result.current_balance).toBe(100.50);
    });
  });

  describe('createTopup', () => {
    it('should create payment intent', async () => {
      const result = await service.createTopup('u1', { amount: 50, method: 'CREDIT_CARD' });
      expect(mockPaymentIntentRepo.create).toHaveBeenCalled();
      expect(mockPaymentIntentRepo.save).toHaveBeenCalled();
      expect(result.amount).toBe(50);
      expect(result.method).toBe('CREDIT_CARD');
    });
  });

  describe('simulateTopupSuccess', () => {
    it('should throw error if intent is not pending', async () => {
      mockPaymentIntentRepo.findOne.mockResolvedValue({ id: 'pi1', status: 'SUCCEEDED' });
      await expect(service.simulateTopupSuccess('pi1')).rejects.toThrow('PaymentIntent inválido ou já processado');
    });

    it('should update intent and wallet balance', async () => {
      mockPaymentIntentRepo.findOne.mockResolvedValue({ id: 'pi1', status: 'PENDING', amount: '50.00', payerUserId: 'u1' });
      mockWalletRepo.findOne.mockResolvedValue({ id: 'w1', ownerId: 'u1', currentBalance: '100.00' });
      mockWalletRepo.findOneOrFail.mockResolvedValue({ id: 'w1', ownerId: 'u1', currentBalance: '100.00' });

      const result = await service.simulateTopupSuccess('pi1');
      
      expect(mockPaymentIntentRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'SUCCEEDED' }));
      expect(mockWalletRepo.save).toHaveBeenCalledWith(expect.objectContaining({ currentBalance: '150.00' }));
      expect(result.new_balance).toBe(150);
    });
  });

  describe('payQrWithCredits', () => {
    it('should throw if qr not found', async () => {
      mockQrService.getQrCharge.mockResolvedValue(null);
      await expect(service.payQrWithCredits('u1', 'qr1')).rejects.toThrow('QRCharge não encontrado');
    });

    it('should throw if qr status is not PENDING', async () => {
      mockQrService.getQrCharge.mockResolvedValue({ id: 'qr1', status: 'PAID' });
      await expect(service.payQrWithCredits('u1', 'qr1')).rejects.toThrow('QRCharge já processado ou inválido');
    });

    it('should throw if qr is expired', async () => {
      mockQrService.getQrCharge.mockResolvedValue({ id: 'qr1', status: 'PENDING', expires_at: new Date(Date.now() - 1000) });
      await expect(service.payQrWithCredits('u1', 'qr1')).rejects.toThrow('QRCharge expirado');
    });

    it('should throw if insufficient balance', async () => {
      mockQrService.getQrCharge.mockResolvedValue({ id: 'qr1', status: 'PENDING', amount: '200.00' });
      mockWalletRepo.findOne.mockResolvedValue({ id: 'w1', currentBalance: '100.00' }); // Balance < Amount
      await expect(service.payQrWithCredits('u1', 'qr1')).rejects.toThrow('Saldo insuficiente na carteira');
    });

    it('should pay with wallet balance and mark qr as paid', async () => {
      mockQrService.getQrCharge.mockResolvedValue({ id: 'qr1', status: 'PENDING', amount: '50.00' });
      mockWalletRepo.findOne.mockResolvedValue({ id: 'w1', currentBalance: '100.00' });
      mockWalletRepo.findOneOrFail.mockResolvedValue({ id: 'w1', currentBalance: '100.00' });

      const result = await service.payQrWithCredits('u1', 'qr1');
      
      expect(mockWalletRepo.save).toHaveBeenCalledWith(expect.objectContaining({ currentBalance: '50.00' }));
      expect(mockQrService.markAsPaid).toHaveBeenCalledWith('qr1');
      expect(result.new_balance).toBe(50);
    });
  });
});
