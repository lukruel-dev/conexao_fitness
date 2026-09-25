import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsWebhookController } from './payments.webhook.controller';
import { PaymentsService } from './payments.service';
import { BookingsService } from '../bookings/bookings.service';
import { BadRequestException } from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service';

describe('PaymentsWebhookController', () => {
  let controller: PaymentsWebhookController;
  let paymentsService: PaymentsService;
  let bookingsService: BookingsService;
  let walletService: WalletService;

  const mockPaymentsService = {
    stripe: {
      webhooks: {
        constructEvent: jest.fn(),
      },
      subscriptions: {
        retrieve: jest.fn(),
      },
    },
    activateSubscription: jest.fn(),
    updateSubscription: jest.fn(),
    cancelSubscription: jest.fn(),
  };

  const mockBookingsService = {
    confirmBooking: jest.fn(),
    cancelBooking: jest.fn(),
  };

  const mockWalletService = {
    simulateTopupSuccess: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsWebhookController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
        {
          provide: BookingsService,
          useValue: mockBookingsService,
        },
        {
          provide: WalletService,
          useValue: mockWalletService,
        },
      ],
    }).compile();

    controller = module.get<PaymentsWebhookController>(PaymentsWebhookController);
    paymentsService = module.get<PaymentsService>(PaymentsService);
    bookingsService = module.get<BookingsService>(BookingsService);
    walletService = module.get<WalletService>(WalletService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleStripeWebhook', () => {
    it('should throw BadRequestException if signature is missing', async () => {
      await expect(controller.handleStripeWebhook('', {} as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if constructEvent fails', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
      (mockPaymentsService.stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        controller.handleStripeWebhook('bad_sig', { rawBody: Buffer.from('payload') } as any),
      ).rejects.toThrow(BadRequestException);

      delete process.env.STRIPE_WEBHOOK_SECRET;
    });

    it('should handle payment_intent.succeeded for booking', async () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_bk_1',
            metadata: { purpose: 'BOOKING', bookingId: 'booking-1' },
          },
        },
      };

      const result = await controller.handleStripeWebhook('sig', { body: event } as any);
      expect(result).toEqual({ received: true });
      expect(mockBookingsService.confirmBooking).toHaveBeenCalledWith('booking-1');
    });

    it('should handle payment_intent.succeeded for wallet topup', async () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_top_1',
            metadata: { purpose: 'WALLET_TOPUP', paymentIntentId: 'topup-intent-42' },
          },
        },
      };

      const result = await controller.handleStripeWebhook('sig', { body: event } as any);
      expect(result).toEqual({ received: true });
      expect(mockWalletService.simulateTopupSuccess).toHaveBeenCalledWith('topup-intent-42');
    });

    it('should handle payment_intent.payment_failed for booking', async () => {
      const event = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_failed_1',
            metadata: { purpose: 'BOOKING', bookingId: 'booking-1' },
          },
        },
      };

      const result = await controller.handleStripeWebhook('sig', { body: event } as any);
      expect(result).toEqual({ received: true });
      expect(mockBookingsService.cancelBooking).toHaveBeenCalledWith('booking-1');
    });

    it('should handle payment_intent.canceled for booking', async () => {
      const event = {
        type: 'payment_intent.canceled',
        data: {
          object: {
            id: 'pi_canceled_1',
            metadata: { purpose: 'BOOKING', bookingId: 'booking-1' },
          },
        },
      };

      const result = await controller.handleStripeWebhook('sig', { body: event } as any);
      expect(result).toEqual({ received: true });
      expect(mockBookingsService.cancelBooking).toHaveBeenCalledWith('booking-1');
    });

    it('should handle invoice.paid for subscription', async () => {
      (mockPaymentsService.stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({
        metadata: { userId: 'user-1' },
      });

      const event = {
        type: 'invoice.paid',
        data: {
          object: {
            subscription: 'sub-1',
          },
        },
      };

      const result = await controller.handleStripeWebhook('sig', { body: event } as any);
      expect(result).toEqual({ received: true });
      expect(mockPaymentsService.activateSubscription).toHaveBeenCalledWith('user-1', 'sub-1');
    });

    it('should handle invoice.payment_succeeded for subscription', async () => {
      (mockPaymentsService.stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({
        metadata: { userId: 'user-2' },
      });

      const event = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            subscription: 'sub-2',
          },
        },
      };

      const result = await controller.handleStripeWebhook('sig', { body: event } as any);
      expect(result).toEqual({ received: true });
      expect(mockPaymentsService.activateSubscription).toHaveBeenCalledWith('user-2', 'sub-2');
    });

    it('should handle customer.subscription.updated', async () => {
      const event = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub-1',
            current_period_end: 1234567890,
          },
        },
      };

      const result = await controller.handleStripeWebhook('sig', { body: event } as any);
      expect(result).toEqual({ received: true });
      expect(mockPaymentsService.updateSubscription).toHaveBeenCalledWith('sub-1', 1234567890);
    });

    it('should handle customer.subscription.deleted', async () => {
      const event = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub-1',
          },
        },
      };

      const result = await controller.handleStripeWebhook('sig', { body: event } as any);
      expect(result).toEqual({ received: true });
      expect(mockPaymentsService.cancelSubscription).toHaveBeenCalledWith('sub-1');
    });

    it('should handle account.updated without error', async () => {
      const event = {
        type: 'account.updated',
        data: {
          object: {
            id: 'acct_123',
            payouts_enabled: true,
            charges_enabled: true,
          },
        },
      };

      const result = await controller.handleStripeWebhook('sig', { body: event } as any);
      expect(result).toEqual({ received: true });
    });

    it('should catch errors gracefully during event processing and return received: true', async () => {
      mockBookingsService.confirmBooking.mockRejectedValueOnce(new Error('DB connection failed'));

      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_err_1',
            metadata: { purpose: 'BOOKING', bookingId: 'booking-boom' },
          },
        },
      };

      const result = await controller.handleStripeWebhook('sig', { body: event } as any);
      expect(result).toEqual({ received: true });
    });
  });
});
