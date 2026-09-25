import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ForbiddenException } from '@nestjs/common';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockPaymentsService = {
    getAccountStatus: jest.fn(),
    getOnboardingLink: jest.fn(),
    createSubscriptionPaymentIntent: jest.fn(),
    confirmSubscription: jest.fn(),
    createPaymentIntentForCheckout: jest.fn(),
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

  describe('getAccountStatus', () => {
    it('should call getAccountStatus with user.id', async () => {
      const mockStatus = {
        isConnected: true,
        accountId: 'acct_123',
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
      };
      mockPaymentsService.getAccountStatus.mockResolvedValue(mockStatus);

      const result = await controller.getAccountStatus({ id: 'user-1' });
      expect(mockPaymentsService.getAccountStatus).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockStatus);
    });
  });

  describe('onboardProvider', () => {
    it('should throw ForbiddenException if user is STUDENT', async () => {
      await expect(
        controller.onboardProvider({ id: 'user-std', role: 'STUDENT' })
      ).rejects.toThrow(ForbiddenException);
      expect(mockPaymentsService.getOnboardingLink).not.toHaveBeenCalled();
    });

    it('should return url if user is a PERSONAL provider', async () => {
      mockPaymentsService.getOnboardingLink.mockResolvedValue('https://connect.stripe.com/setup/s/123');
      const result = await controller.onboardProvider({ id: 'user-1', role: 'PERSONAL' }, '/perfil');
      expect(result).toEqual({ url: 'https://connect.stripe.com/setup/s/123' });
      expect(mockPaymentsService.getOnboardingLink).toHaveBeenCalledWith('user-1', '/perfil');
    });

    it('should return url if user is an ACADEMIA provider without returnPath', async () => {
      mockPaymentsService.getOnboardingLink.mockResolvedValue('https://connect.stripe.com/setup/s/456');
      const result = await controller.onboardProvider({ id: 'user-acad', role: 'ACADEMIA' });
      expect(result).toEqual({ url: 'https://connect.stripe.com/setup/s/456' });
      expect(mockPaymentsService.getOnboardingLink).toHaveBeenCalledWith('user-acad', undefined);
    });
  });

  describe('createSubscription', () => {
    it('should return error if priceId is missing', async () => {
      const result = await controller.createSubscription('', 'Plan', { id: 'user-1', role: 'PERSONAL' });
      expect(result).toEqual({ error: 'priceId is required' });
      expect(mockPaymentsService.createSubscriptionPaymentIntent).not.toHaveBeenCalled();
    });

    it('should call createSubscriptionPaymentIntent with user.id, priceId and planName', async () => {
      mockPaymentsService.createSubscriptionPaymentIntent.mockResolvedValue({
        clientSecret: 'secret_1',
        subscriptionId: 'sub_1',
      } as any);
      const result = await controller.createSubscription('price-1', 'Pro', { id: 'user-1', role: 'PERSONAL' });
      expect(result).toEqual({ clientSecret: 'secret_1', subscriptionId: 'sub_1' });
      expect(mockPaymentsService.createSubscriptionPaymentIntent).toHaveBeenCalledWith('user-1', 'price-1', 'Pro');
    });
  });

  describe('confirmSubscription', () => {
    it('should call confirmSubscription with user.id, planName and subscriptionId', async () => {
      const mockResponse = {
        success: true,
        subscriptionId: 'sub_rec_123',
        planName: 'Elite',
        status: 'ACTIVE',
      };
      mockPaymentsService.confirmSubscription.mockResolvedValue(mockResponse);

      const result = await controller.confirmSubscription(
        { id: 'user-1' },
        'Elite',
        'sub_stripe_123',
      );
      expect(mockPaymentsService.confirmSubscription).toHaveBeenCalledWith('user-1', 'Elite', 'sub_stripe_123');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('cancelSubscription', () => {
    it('should call confirmSubscription with user.id and Gratuito', async () => {
      mockPaymentsService.confirmSubscription.mockResolvedValue({
        success: true,
        planName: 'Gratuito',
        message: 'Plano Gratuito ativo.',
      });

      const result = await controller.cancelSubscription({ id: 'user-1' });
      expect(mockPaymentsService.confirmSubscription).toHaveBeenCalledWith('user-1', 'Gratuito');
      expect(result).toEqual({
        success: true,
        planName: 'Gratuito',
        message: 'Plano Gratuito ativo.',
      });
    });
  });

  describe('createIntent', () => {
    it('should call createPaymentIntentForCheckout with correct parameters', async () => {
      const mockResult = {
        clientSecret: 'pi_test_secret',
        paymentIntentId: 'pi_test_id',
      };
      mockPaymentsService.createPaymentIntentForCheckout.mockResolvedValue(mockResult);

      const dto = {
        providerId: 'prov-1',
        amount: 150.0,
        purpose: 'PLAN_HIRING' as const,
        title: 'Mensalidade Academia',
        referenceId: 'plan-ref-1',
      };

      const result = await controller.createIntent({ id: 'student-1' }, dto);
      expect(mockPaymentsService.createPaymentIntentForCheckout).toHaveBeenCalledWith({
        studentId: 'student-1',
        providerId: 'prov-1',
        amount: 150.0,
        purpose: 'PLAN_HIRING',
        title: 'Mensalidade Academia',
        referenceId: 'plan-ref-1',
      });
      expect(result).toEqual(mockResult);
    });
  });
});
