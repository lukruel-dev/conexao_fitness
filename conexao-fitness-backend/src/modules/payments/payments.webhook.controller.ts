import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Req, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { BookingsService } from '../bookings/bookings.service';
import { WalletService } from '../wallet/wallet.service';

@Controller('webhooks/payments')
export class PaymentsWebhookController {
  constructor(
    private readonly paymentsService: PaymentsService,
    @Inject(forwardRef(() => BookingsService))
    private readonly bookingsService: BookingsService,
    @Inject(forwardRef(() => WalletService))
    private readonly walletService: WalletService,
  ) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: any,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    let event;
    try {
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      if (secret && req.rawBody) {
        event = this.paymentsService.stripe.webhooks.constructEvent(
          req.rawBody,
          signature,
          secret
        );
      } else {
        event = req.body;
      }
    } catch (err: any) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    // PaymentIntent Webhooks (Booking & Top-up)
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any;
      const purpose = paymentIntent.metadata?.purpose;

      if (purpose === 'BOOKING') {
        const bookingId = paymentIntent.metadata?.bookingId;
        if (bookingId) {
          await this.bookingsService.confirmBooking(bookingId);
        }
      } else if (purpose === 'WALLET_TOPUP') {
        const topupIntentId = paymentIntent.metadata?.paymentIntentId;
        if (topupIntentId) {
          await this.walletService.simulateTopupSuccess(topupIntentId);
        }
      }
    } else if (event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') {
      const paymentIntent = event.data.object as any;
      const purpose = paymentIntent.metadata?.purpose;

      if (purpose === 'BOOKING') {
        const bookingId = paymentIntent.metadata?.bookingId;
        if (bookingId) {
          await this.bookingsService.cancelBooking(bookingId);
        }
      }
    }

    // Invoice Webhooks (Subscriptions)
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as any;
      const subscriptionId = invoice.subscription;
      
      // Quando a assinatura é criada, a primeira invoice gera esse evento.
      // E usamos o metadata 'userId' (no subscription) para ativá-la
      const stripeSub = await this.paymentsService.stripe.subscriptions.retrieve(subscriptionId);
      const userId = stripeSub.metadata?.userId;
      
      if (userId && subscriptionId) {
        await this.paymentsService.activateSubscription(userId, subscriptionId);
      }
    } else if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as any;
      await this.paymentsService.updateSubscription(subscription.id, subscription.current_period_end);
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any;
      await this.paymentsService.cancelSubscription(subscription.id);
    }

    return { received: true };
  }
}
