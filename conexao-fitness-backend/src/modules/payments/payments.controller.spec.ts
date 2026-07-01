import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockPaymentsService = {
    getOnboardingLink: jest.fn(),
    createSubscriptionCheckout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('onboardProvider', () => {
    it('should return error if user is STUDENT', async () => {
      const result = await controller.onboardProvider({ role: 'STUDENT' });
      expect(result).toEqual({ error: 'Only providers can onboard' });
    });

    it('should return url if user is a provider', async () => {
      mockPaymentsService.getOnboardingLink.mockResolvedValue('http://onboarding.url');
      const result = await controller.onboardProvider({ id: 'user-1', role: 'PERSONAL' });
      expect(result).toEqual({ url: 'http://onboarding.url' });
      expect(mockPaymentsService.getOnboardingLink).toHaveBeenCalledWith('user-1');
    });
  });

  describe('createSubscription', () => {
    it('should return error if user is STUDENT', async () => {
      const result = await controller.createSubscription('price-1', { role: 'STUDENT' });
      expect(result).toEqual({ error: 'Only providers can subscribe' });
    });

    it('should return error if priceId is missing', async () => {
      const result = await controller.createSubscription('', { role: 'PERSONAL' });
      expect(result).toEqual({ error: 'priceId is required' });
    });

    it('should call createSubscriptionCheckout', async () => {
      mockPaymentsService.createSubscriptionCheckout.mockResolvedValue({ checkoutUrl: 'http://checkout.url' } as any);
      const result = await controller.createSubscription('price-1', { id: 'user-1', role: 'PERSONAL' });
      expect(result).toEqual({ checkoutUrl: 'http://checkout.url' });
      expect(mockPaymentsService.createSubscriptionCheckout).toHaveBeenCalledWith('user-1', 'price-1');
    });
  });
});
