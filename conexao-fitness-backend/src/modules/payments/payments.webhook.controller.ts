import { Controller, Post, Headers, HttpCode, HttpStatus, Req, BadRequestException, forwardRef, Inject, Logger } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { BookingsService } from '../bookings/bookings.service';
import { WalletService } from '../wallet/wallet.service';

@Controller('webhooks/payments')
export class PaymentsWebhookController {
  private readonly logger = new Logger(PaymentsWebhookController.name);

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
      this.logger.warn('Requisição de webhook sem cabeçalho stripe-signature');
      throw new BadRequestException('Missing stripe-signature header');
    }

    let event: any;
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
      this.logger.error(`Falha na validação de assinatura do Stripe Webhook: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`[Stripe Webhook] Evento recebido: ${event.type} (ID: ${event.id})`);

    try {
      // 1. PaymentIntent Webhooks (Booking, Top-up, Planos)
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as any;
        const purpose = paymentIntent.metadata?.purpose;

        this.logger.log(`[Stripe Webhook] payment_intent.succeeded para purpose=${purpose}, id=${paymentIntent.id}`);

        if (purpose === 'BOOKING') {
          const bookingId = paymentIntent.metadata?.bookingId;
          if (bookingId) {
            await this.bookingsService.confirmBooking(bookingId);
            this.logger.log(`[Stripe Webhook] Booking ${bookingId} confirmado com sucesso.`);
          }
        } else if (purpose === 'WALLET_TOPUP') {
          const topupIntentId = paymentIntent.metadata?.paymentIntentId;
          if (topupIntentId) {
            await this.walletService.simulateTopupSuccess(topupIntentId);
            this.logger.log(`[Stripe Webhook] Recarga de saldo ${topupIntentId} creditada na carteira.`);
          }
        }
      } else if (event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') {
        const paymentIntent = event.data.object as any;
        const purpose = paymentIntent.metadata?.purpose;

        this.logger.warn(`[Stripe Webhook] ${event.type} para purpose=${purpose}, id=${paymentIntent.id}`);

        if (purpose === 'BOOKING') {
          const bookingId = paymentIntent.metadata?.bookingId;
          if (bookingId) {
            await this.bookingsService.cancelBooking(bookingId);
            this.logger.log(`[Stripe Webhook] Booking ${bookingId} cancelado devido a falha no pagamento.`);
          }
        }
      }

      // 2. Invoice Webhooks (Assinaturas SaaS)
      else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;
        
        if (subscriptionId) {
          const stripeSub = await this.paymentsService.stripe.subscriptions.retrieve(subscriptionId);
          const userId = stripeSub.metadata?.userId;
          
          if (userId) {
            await this.paymentsService.activateSubscription(userId, subscriptionId);
            this.logger.log(`[Stripe Webhook] Assinatura ${subscriptionId} ativada para usuário ${userId}`);
          }
        }
      } else if (event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as any;
        await this.paymentsService.updateSubscription(subscription.id, subscription.current_period_end);
        this.logger.log(`[Stripe Webhook] Assinatura ${subscription.id} atualizada.`);
      } else if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as any;
        await this.paymentsService.cancelSubscription(subscription.id);
        this.logger.log(`[Stripe Webhook] Assinatura ${subscription.id} cancelada.`);
      }

      // 3. Connect Account Webhooks (Onboarding de Profissionais e Academias)
      else if (event.type === 'account.updated') {
        const account = event.data.object as any;
        this.logger.log(
          `[Stripe Webhook] Conta Connect atualizada: ${account.id} (payouts_enabled=${account.payouts_enabled}, charges_enabled=${account.charges_enabled})`
        );
      }
    } catch (processErr: any) {
      this.logger.error(`[Stripe Webhook] Erro ao processar evento ${event.type}: ${processErr.message}`, processErr.stack);
    }

    return { received: true };
  }
}
