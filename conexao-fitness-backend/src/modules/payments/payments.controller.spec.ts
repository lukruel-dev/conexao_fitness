import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockPaymentsService = {
    getAccountStatus: jest.fn(),
    getOnboardingLink: jest.fn(),
    createSubscriptionPaymentIntent: jest.fn(),
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
    it('should return error if priceId is missing', async () => {
      const result = await controller.createSubscription('', 'Plan', { role: 'PERSONAL' });
      expect(result).toEqual({ error: 'priceId is required' });
    });

    it('should call createSubscriptionPaymentIntent', async () => {
      mockPaymentsService.createSubscriptionPaymentIntent.mockResolvedValue({
        clientSecret: 'secret_1',
        subscriptionId: 'sub_1',
      } as any);
      const result = await controller.createSubscription('price-1', 'Plan', { id: 'user-1', role: 'PERSONAL' });
      expect(result).toEqual({ clientSecret: 'secret_1', subscriptionId: 'sub_1' });
      expect(mockPaymentsService.createSubscriptionPaymentIntent).toHaveBeenCalledWith('user-1', 'price-1');
    });
  });
});
