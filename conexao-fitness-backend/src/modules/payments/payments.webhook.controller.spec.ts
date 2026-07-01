import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsWebhookController } from './payments.webhook.controller';
import { PaymentsService } from './payments.service';
import { BookingsService } from '../bookings/bookings.service';
import { BadRequestException } from '@nestjs/common';

describe('PaymentsWebhookController', () => {
  let controller: PaymentsWebhookController;
  let paymentsService: PaymentsService;
  let bookingsService: BookingsService;

  const mockPaymentsService = {
    stripe: {
      webhooks: {
        constructEvent: jest.fn(),
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
      ],
    }).compile();

    controller = module.get<PaymentsWebhookController>(PaymentsWebhookController);
    paymentsService = module.get<PaymentsService>(PaymentsService);
    bookingsService = module.get<BookingsService>(BookingsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleStripeWebhook', () => {
    it('should throw BadRequestException if signature is missing', async () => {
      await expect(controller.handleStripeWebhook('', {} as any)).rejects.toThrow(BadRequestException);
    });

    it('should handle checkout.session.completed for booking', async () => {
      const event = {
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { bookingId: 'booking-1' },
          },
        },
      };

      const result = await controller.handleStripeWebhook('sig', { body: event } as any);
      expect(result).toEqual({ received: true });
      expect(mockBookingsService.confirmBooking).toHaveBeenCalledWith('booking-1');
    });

    it('should handle checkout.session.expired for booking', async () => {
      const event = {
        type: 'checkout.session.expired',
        data: {
          object: {
            metadata: { bookingId: 'booking-1' },
          },
        },
      };

      const result = await controller.handleStripeWebhook('sig', { body: event } as any);
      expect(result).toEqual({ received: true });
      expect(mockBookingsService.cancelBooking).toHaveBeenCalledWith('booking-1');
    });

    it('should handle checkout.session.completed for subscription', async () => {
      const event = {
        type: 'checkout.session.completed',
        data: {
          object: {
            mode: 'subscription',
            metadata: { userId: 'user-1' },
            subscription: 'sub-1',
          },
        },
      };

      const result = await controller.handleStripeWebhook('sig', { body: event } as any);
      expect(result).toEqual({ received: true });
      expect(mockPaymentsService.activateSubscription).toHaveBeenCalledWith('user-1', 'sub-1');
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
  });
});
