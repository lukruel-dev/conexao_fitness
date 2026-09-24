import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_123' }),
    },
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ id: 'pi_test', client_secret: 'secret_123' }),
    },
    subscriptions: {
      create: jest.fn().mockResolvedValue({
        id: 'sub_stripe_1',
        latest_invoice: {
          payment_intent: { client_secret: 'pi_secret_1' },
        },
      }),
    },
    accounts: {
      create: jest.fn().mockResolvedValue({ id: 'acct_new123' }),
    },
    accountLinks: {
      create: jest.fn().mockResolvedValue({ url: 'http://onboarding.url' }),
    },
  }));
});

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockUserRepo = {
    findOneBy: jest.fn(),
    save: jest.fn(),
  };

  const mockSubscriptionRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepo,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateSplit', () => {
    it('should correctly calculate platform fee and provider amount with default 10%', () => {
      const result = service.calculateSplit(100, 0.10);
      expect(result.platformFee).toBe(10);
      expect(result.providerAmount).toBe(90);
    });
  });

  describe('createPaymentIntentForBooking', () => {
    it('should throw NotFoundException if provider does not exist', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);
      await expect(
        service.createPaymentIntentForBooking('booking-1', 100, 'provider-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if provider has no stripeAccountId in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      mockUserRepo.findOneBy.mockResolvedValue({ id: 'provider-1', role: 'PERSONAL' });

      await expect(
        service.createPaymentIntentForBooking('booking-1', 100, 'provider-1'),
      ).rejects.toThrow(BadRequestException);

      process.env.NODE_ENV = originalEnv;
    });

    it('should create a payment intent successfully with split if valid stripeAccountId', async () => {
      mockUserRepo.findOneBy.mockResolvedValue({ id: 'provider-1', role: 'PERSONAL', stripeAccountId: 'acct_123' });
      mockSubscriptionRepo.findOne.mockResolvedValue(null);

      const result = await service.createPaymentIntentForBooking('booking-1', 100, 'provider-1');
      expect(result).toEqual({
        clientSecret: 'secret_123',
        paymentIntentId: 'pi_test',
      });
      expect(service.stripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 10000,
          currency: 'brl',
          application_fee_amount: 1200,
          transfer_data: { destination: 'acct_123' },
        })
      );
    });
  });

  describe('getOnboardingLink', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);
      await expect(service.getOnboardingLink('user-1')).rejects.toThrow(NotFoundException);
    });

    it('should create a new account and link if user does not have stripeAccountId', async () => {
      const user = { id: 'user-1', email: 'test@test.com' };
      mockUserRepo.findOneBy.mockResolvedValue(user);
      mockUserRepo.save.mockResolvedValue({ ...user, stripeAccountId: 'acct_new123' });

      const url = await service.getOnboardingLink('user-1');
      expect(service.stripe.accounts.create).toHaveBeenCalled();
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(service.stripe.accountLinks.create).toHaveBeenCalled();
      expect(url).toBe('http://onboarding.url');
    });

    it('should only create link if user already has stripeAccountId', async () => {
      const user = { id: 'user-1', email: 'test@test.com', stripeAccountId: 'acct_existing' };
      mockUserRepo.findOneBy.mockResolvedValue(user);

      const url = await service.getOnboardingLink('user-1');
      expect(service.stripe.accounts.create).not.toHaveBeenCalled();
      expect(service.stripe.accountLinks.create).toHaveBeenCalledWith(
        expect.objectContaining({ account: 'acct_existing' })
      );
      expect(url).toBe('http://onboarding.url');
    });
  });

  describe('handleWebhook', () => {
    it('should return { received: true }', async () => {
      const result = await service.handleWebhook({ event: 'test' });
      expect(result).toEqual({ received: true });
    });
  });

  describe('createSubscriptionPaymentIntent', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);
      await expect(service.createSubscriptionPaymentIntent('user-1', 'price-1')).rejects.toThrow(NotFoundException);
    });

    it('should create subscription and payment intent for user', async () => {
      mockUserRepo.findOneBy.mockResolvedValue({ id: 'user-1', email: 'test@test.com' });
      mockSubscriptionRepo.create.mockReturnValue({ id: 'sub-1' });

      const result = await service.createSubscriptionPaymentIntent('user-1', 'price-1');
      expect(mockSubscriptionRepo.create).toHaveBeenCalled();
      expect(mockSubscriptionRepo.save).toHaveBeenCalled();
      expect(service.stripe.subscriptions.create).toHaveBeenCalled();
      expect(result).toEqual({
        clientSecret: 'pi_secret_1',
        subscriptionId: 'sub_stripe_1',
      });
    });
  });

  describe('activateSubscription', () => {
    it('should activate a pending subscription', async () => {
      const sub = { id: 'sub-1', status: SubscriptionStatus.PENDING };
      mockSubscriptionRepo.findOne.mockResolvedValue(sub);

      await service.activateSubscription('user-1', 'ext-sub-1');
      expect(sub.status).toBe(SubscriptionStatus.ACTIVE);
      expect(mockSubscriptionRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        status: SubscriptionStatus.ACTIVE,
        externalSubscriptionId: 'ext-sub-1'
      }));
    });
    
    it('should do nothing if pending subscription not found', async () => {
      mockSubscriptionRepo.findOne.mockResolvedValue(null);
      await service.activateSubscription('user-1', 'ext-sub-1');
      expect(mockSubscriptionRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription period end', async () => {
      const sub = { id: 'sub-1' };
      mockSubscriptionRepo.findOneBy.mockResolvedValue(sub);

      await service.updateSubscription('ext-sub-1', 1600000000);
      expect(mockSubscriptionRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: new Date(1600000000 * 1000)
      }));
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription', async () => {
      const sub = { id: 'sub-1' };
      mockSubscriptionRepo.findOneBy.mockResolvedValue(sub);

      await service.cancelSubscription('ext-sub-1');
      expect(mockSubscriptionRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        status: SubscriptionStatus.CANCELED
      }));
    });
  });
});
