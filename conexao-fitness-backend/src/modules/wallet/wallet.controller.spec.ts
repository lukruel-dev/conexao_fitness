import { Test, TestingModule } from '@nestjs/testing';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

describe('WalletController', () => {
  let controller: WalletController;

  const mockWalletService = {
    getMyBalance: jest.fn(),
    createTopup: jest.fn(),
    simulateTopupSuccess: jest.fn(),
    payQrWithCredits: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        { provide: WalletService, useValue: mockWalletService },
      ],
    }).compile();

    controller = module.get<WalletController>(WalletController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyBalance', () => {
    it('should call getMyBalance', async () => {
      mockWalletService.getMyBalance.mockResolvedValue({ current_balance: 100 });
      const result = await controller.getMyBalance({ id: 'u1' });
      expect(result).toEqual({ current_balance: 100 });
      expect(mockWalletService.getMyBalance).toHaveBeenCalledWith('u1');
    });
  });

  describe('createTopup', () => {
    it('should call createTopup', async () => {
      mockWalletService.createTopup.mockResolvedValue({ payment_intent_id: 'pi1' });
      const result = await controller.createTopup({ amount: 50, method: 'PIX' }, { id: 'u1' });
      expect(result).toEqual({ payment_intent_id: 'pi1' });
      expect(mockWalletService.createTopup).toHaveBeenCalledWith('u1', { amount: 50, method: 'PIX' });
    });
  });

  describe('simulateTopupSuccess', () => {
    it('should call simulateTopupSuccess', async () => {
      mockWalletService.simulateTopupSuccess.mockResolvedValue({ new_balance: 150 });
      const result = await controller.simulateTopupSuccess('pi1');
      expect(result).toEqual({ new_balance: 150 });
      expect(mockWalletService.simulateTopupSuccess).toHaveBeenCalledWith('pi1');
    });
  });

  describe('payQrWithCredits', () => {
    it('should call payQrWithCredits', async () => {
      mockWalletService.payQrWithCredits.mockResolvedValue({ new_balance: 50 });
      const result = await controller.payQrWithCredits('qr1', { id: 'u1' });
      expect(result).toEqual({ new_balance: 50 });
      expect(mockWalletService.payQrWithCredits).toHaveBeenCalledWith('u1', 'qr1');
    });
  });
});
