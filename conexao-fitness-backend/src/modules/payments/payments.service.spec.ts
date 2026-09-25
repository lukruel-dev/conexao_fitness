import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

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
      retrieve: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
    },
    accounts: {
      create: jest.fn().mockResolvedValue({ id: 'acct_new123' }),
      retrieve: jest.fn(),
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
    find: jest.fn(),
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

  describe('getCommissionRate', () => {
    it('should return correct rates for PERSONAL plans', () => {
      expect(service.getCommissionRate('PERSONAL', 'Gratuito')).toBe(0.12);
      expect(service.getCommissionRate('PERSONAL', 'Start')).toBe(0.10);
      expect(service.getCommissionRate('PERSONAL', 'Pro')).toBe(0.08);
      expect(service.getCommissionRate('PERSONAL', 'Elite')).toBe(0.06);
      expect(service.getCommissionRate('PERSONAL', undefined)).toBe(0.12);
    });

    it('should return correct rates for ACADEMIA plans', () => {
      expect(service.getCommissionRate('ACADEMIA', 'Gratuito')).toBe(0.12);
      expect(service.getCommissionRate('ACADEMIA', 'Essencial')).toBe(0.10);
      expect(service.getCommissionRate('ACADEMIA', 'Destaque')).toBe(0.08);
      expect(service.getCommissionRate('ACADEMIA', 'Elite')).toBe(0.06);
      expect(service.getCommissionRate('ACADEMIA', undefined)).toBe(0.12);
    });
  });

  describe('calculateSplit', () => {
    it('should correctly calculate platform fee and provider amount with custom and default rates', () => {
      const result10 = service.calculateSplit(100, 0.10);
      expect(result10.platformFee).toBe(10);
      expect(result10.providerAmount).toBe(90);
      expect(result10.rate).toBe(0.10);

      const result6 = service.calculateSplit(250, 0.06);
      expect(result6.platformFee).toBe(15);
      expect(result6.providerAmount).toBe(235);
      expect(result6.rate).toBe(0.06);
    });
  });

  describe('getOrCreateCustomer', () => {
    it('should return existing stripeCustomerId if user already has one', async () => {
      const user = { id: 'u1', email: 'user@test.com', stripeCustomerId: 'cus_existing' } as User;
      const res = await service.getOrCreateCustomer(user);
      expect(res).toBe('cus_existing');
      expect(service.stripe.customers.create).not.toHaveBeenCalled();
    });

    it('should create new customer in Stripe and update user if stripeCustomerId is missing', async () => {
      const user = { id: 'u2', email: 'new@test.com', name: 'New User' } as User;
      const res = await service.getOrCreateCustomer(user);
      expect(res).toBe('cus_123');
      expect(service.stripe.customers.create).toHaveBeenCalledWith({
        email: 'new@test.com',
        name: 'New User',
        metadata: { userId: 'u2' },
      });
      expect(mockUserRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'u2', stripeCustomerId: 'cus_123' }),
      );
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
        }),
      );
    });
  });

  describe('createPaymentIntentForCheckout', () => {
    it('should throw NotFoundException if provider not found', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);
      await expect(
        service.createPaymentIntentForCheckout({
          studentId: 'st-1',
          providerId: 'prov-notfound',
          amount: 200,
          purpose: 'PLAN_HIRING',
          title: 'Plano Semestral',
          referenceId: 'ref-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create payment intent with split based on provider active subscription', async () => {
      mockUserRepo.findOneBy.mockResolvedValue({
        id: 'prov-1',
        role: 'ACADEMIA',
        stripeAccountId: 'acct_acad_123',
      });
      mockSubscriptionRepo.findOne.mockResolvedValue({ planName: 'Elite' });

      const result = await service.createPaymentIntentForCheckout({
        studentId: 'st-1',
        providerId: 'prov-1',
        amount: 200,
        purpose: 'PLAN_HIRING',
        title: 'Plano Semestral',
        referenceId: 'ref-1',
      });

      expect(result).toEqual({
        clientSecret: 'secret_123',
        paymentIntentId: 'pi_test',
      });
      // Elite = 6% commission fee => 200 * 0.06 = 12 BRL = 1200 cents
      expect(service.stripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 20000,
          currency: 'brl',
          application_fee_amount: 1200,
          transfer_data: { destination: 'acct_acad_123' },
          metadata: expect.objectContaining({
            purpose: 'PLAN_HIRING',
            studentId: 'st-1',
            providerId: 'prov-1',
            referenceId: 'ref-1',
            commissionRate: '6%',
          }),
        }),
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

      const url = await service.getOnboardingLink('user-1', '/dashboard');
      expect(service.stripe.accounts.create).not.toHaveBeenCalled();
      expect(service.stripe.accountLinks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          account: 'acct_existing',
          refresh_url: expect.stringContaining('/dashboard?stripe=refresh'),
          return_url: expect.stringContaining('/dashboard?stripe=success'),
        }),
      );
      expect(url).toBe('http://onboarding.url');
    });

    it('should throw BadRequestException if stripe throws invalid api key', async () => {
      mockUserRepo.findOneBy.mockResolvedValue({ id: 'user-err', email: 'e@test.com' });
      (service.stripe.accounts.create as jest.Mock).mockRejectedValueOnce(new Error('Invalid API Key provided'));

      await expect(service.getOnboardingLink('user-err')).rejects.toThrow(BadRequestException);
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

    it('should create subscription and payment intent for user starting from free', async () => {
      mockUserRepo.findOneBy.mockResolvedValue({ id: 'user-1', email: 'test@test.com' });
      mockSubscriptionRepo.findOne.mockResolvedValue(null);
      mockSubscriptionRepo.create.mockReturnValue({ id: 'sub-1' });

      const result = await service.createSubscriptionPaymentIntent('user-1', 'price-1', 'Pro');
      expect(mockSubscriptionRepo.create).toHaveBeenCalledWith({
        userId: 'user-1',
        planName: 'Pro',
        status: SubscriptionStatus.PENDING,
      });
      expect(mockSubscriptionRepo.save).toHaveBeenCalled();
      expect(service.stripe.subscriptions.create).toHaveBeenCalled();
      expect(result).toEqual({
        clientSecret: 'pi_secret_1',
        subscriptionId: 'sub_stripe_1',
      });
    });

    it('should migrate active subscription with proration when user already has Stripe sub', async () => {
      mockUserRepo.findOneBy.mockResolvedValue({ id: 'user-upgrade', email: 'up@test.com' });
      mockSubscriptionRepo.findOne.mockResolvedValue({
        id: 'sub-active',
        externalSubscriptionId: 'sub_stripe_existing',
        status: SubscriptionStatus.ACTIVE,
      });

      (service.stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({
        id: 'sub_stripe_existing',
        status: 'active',
        items: {
          data: [{ id: 'si_item_123' }],
        },
      });

      (service.stripe.subscriptions.update as jest.Mock).mockResolvedValue({
        id: 'sub_stripe_existing',
        latest_invoice: {
          amount_due: 4990,
          payment_intent: { client_secret: 'pi_upgrade_secret' },
        },
      });

      const result = await service.createSubscriptionPaymentIntent('user-upgrade', 'price_elite', 'Elite');
      expect(service.stripe.subscriptions.update).toHaveBeenCalledWith('sub_stripe_existing', expect.objectContaining({
        items: [{ id: 'si_item_123', price: 'price_elite' }],
        proration_behavior: 'always_invoice',
      }));
      expect(result).toEqual({
        clientSecret: 'pi_upgrade_secret',
        subscriptionId: 'sub_stripe_existing',
        isUpgrade: true,
        differenceAmount: 49.9,
      });
    });
  });

  describe('createPaymentIntentForTopup', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);
      await expect(service.createPaymentIntentForTopup('u-1', 'top-1', 50)).rejects.toThrow(NotFoundException);
    });

    it('should create payment intent for wallet topup', async () => {
      mockUserRepo.findOneBy.mockResolvedValue({ id: 'u-1' });
      const result = await service.createPaymentIntentForTopup('u-1', 'top-1', 50);

      expect(result).toEqual({
        clientSecret: 'secret_123',
        paymentIntentId: 'pi_test',
      });
      expect(service.stripe.paymentIntents.create).toHaveBeenCalledWith(expect.objectContaining({
        amount: 5000,
        currency: 'brl',
        metadata: {
          paymentIntentId: 'top-1',
          userId: 'u-1',
          purpose: 'WALLET_TOPUP',
        },
      }));
    });

    it('should return mock fallback if Stripe fails during topup', async () => {
      mockUserRepo.findOneBy.mockResolvedValue({ id: 'u-1' });
      (service.stripe.paymentIntents.create as jest.Mock).mockRejectedValueOnce(new Error('Stripe API error'));

      const result = await service.createPaymentIntentForTopup('u-1', 'top-999', 30);
      expect(result).toEqual({
        clientSecret: 'pi_mock_top-999_secret_mock',
        paymentIntentId: 'pi_mock_top-999',
      });
    });
  });

  describe('confirmSubscription', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);
      await expect(service.confirmSubscription('u-none', 'Pro')).rejects.toThrow(NotFoundException);
    });

    it('should cancel existing subscriptions and return Gratuito message when reverting to Gratuito', async () => {
      mockUserRepo.findOneBy.mockResolvedValue({ id: 'u-1', email: 'u1@test.com' });
      const activeSub = {
        id: 's1',
        status: SubscriptionStatus.ACTIVE,
        externalSubscriptionId: 'sub_stripe_old',
      };
      mockSubscriptionRepo.find.mockResolvedValue([activeSub]);

      const result = await service.confirmSubscription('u-1', 'Gratuito');

      expect(activeSub.status).toBe(SubscriptionStatus.CANCELED);
      expect(mockSubscriptionRepo.save).toHaveBeenCalledWith(activeSub);
      expect(service.stripe.subscriptions.cancel).toHaveBeenCalledWith('sub_stripe_old');
      expect(result).toEqual({
        success: true,
        planName: 'Gratuito',
        message: 'Plano Gratuito ativo.',
      });
    });

    it('should cancel previous subscriptions and create new active subscription for paid plan', async () => {
      mockUserRepo.findOneBy.mockResolvedValue({ id: 'u-1', email: 'u1@test.com' });
      mockSubscriptionRepo.find.mockResolvedValue([]);
      const newSub = {
        id: 'sub-new-1',
        userId: 'u-1',
        planName: 'Elite',
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: new Date(),
      };
      mockSubscriptionRepo.create.mockReturnValue(newSub);
      mockSubscriptionRepo.save.mockResolvedValue(newSub);

      const result = await service.confirmSubscription('u-1', 'Elite', 'sub_stripe_new');

      expect(mockSubscriptionRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'u-1',
        planName: 'Elite',
        status: SubscriptionStatus.ACTIVE,
        externalSubscriptionId: 'sub_stripe_new',
      }));
      expect(result).toEqual({
        success: true,
        subscriptionId: 'sub-new-1',
        planName: 'Elite',
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: newSub.currentPeriodEnd,
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
        externalSubscriptionId: 'ext-sub-1',
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
        currentPeriodEnd: new Date(1600000000 * 1000),
      }));
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription', async () => {
      const sub = { id: 'sub-1' };
      mockSubscriptionRepo.findOneBy.mockResolvedValue(sub);

      await service.cancelSubscription('ext-sub-1');
      expect(mockSubscriptionRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        status: SubscriptionStatus.CANCELED,
      }));
    });
  });

  describe('getAccountStatus', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);
      await expect(service.getAccountStatus('u-none')).rejects.toThrow(NotFoundException);
    });

    it('should return disconnected when user has no stripeAccountId', async () => {
      mockUserRepo.findOneBy.mockResolvedValue({ id: 'u-1', stripeAccountId: null });
      const status = await service.getAccountStatus('u-1');
      expect(status).toEqual({
        isConnected: false,
        accountId: null,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      });
    });

    it('should retrieve status from Stripe when user has stripeAccountId', async () => {
      mockUserRepo.findOneBy.mockResolvedValue({ id: 'u-1', stripeAccountId: 'acct_123' });
      (service.stripe.accounts.retrieve as jest.Mock).mockResolvedValue({
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
      });

      const status = await service.getAccountStatus('u-1');
      expect(status).toEqual({
        isConnected: true,
        accountId: 'acct_123',
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
      });
    });

    it('should gracefully handle Stripe retrieval error', async () => {
      mockUserRepo.findOneBy.mockResolvedValue({ id: 'u-1', stripeAccountId: 'acct_err' });
      (service.stripe.accounts.retrieve as jest.Mock).mockRejectedValue(new Error('Network error'));

      const status = await service.getAccountStatus('u-1');
      expect(status).toEqual({
        isConnected: false,
        accountId: 'acct_err',
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        error: 'Network error',
      });
    });
  });
});
