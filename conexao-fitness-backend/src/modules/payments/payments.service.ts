import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import Stripe from 'stripe';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly PLATFORM_FEE_PERCENTAGE = 0.10;
  public readonly stripe: Stripe;

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
      apiVersion: '2024-12-18.acacia' as any,
    });
  }

  /**
   * Calcula o Split Payment
   */
  calculateSplit(totalAmount: number): { platformFee: number; providerAmount: number } {
    const platformFee = totalAmount * this.PLATFORM_FEE_PERCENTAGE;
    const providerAmount = totalAmount - platformFee;
    return {
      platformFee: Number(platformFee.toFixed(2)),
      providerAmount: Number(providerAmount.toFixed(2)),
    };
  }

  /**
   * Cria uma sessão de checkout no Stripe (Split Payment)
   */
  async createCheckoutSessionForBooking(bookingId: string, amount: number, providerId: string) {
    this.logger.log(`Criando sessão do Stripe para o booking ${bookingId}`);
    
    const provider = await this.userRepo.findOneBy({ id: providerId });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    if (!provider.stripeAccountId && process.env.NODE_ENV === 'production') {
      throw new BadRequestException('O profissional ainda não configurou sua conta de recebimento (Stripe Connect).');
    }

    const { platformFee, providerAmount } = this.calculateSplit(amount);
    
    // Stripe expects amounts in cents (e.g. 50.00 BRL = 5000)
    const amountInCents = Math.round(amount * 100);
    const platformFeeInCents = Math.round(platformFee * 100);

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Reserva Conexão Fitness',
              description: `Booking ID: ${bookingId}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        bookingId: bookingId,
      },
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/agendamentos?success=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/agendamentos?canceled=true`,
    };

    // Aplica o Split Payment apenas se tiver uma conta conectada válida do Stripe
    if (provider.stripeAccountId && provider.stripeAccountId.startsWith('acct_')) {
      sessionConfig.payment_intent_data = {
        application_fee_amount: platformFeeInCents,
        transfer_data: {
          destination: provider.stripeAccountId,
        },
      };
    }

    const session = await this.stripe.checkout.sessions.create(sessionConfig);

    return {
      checkoutUrl: session.url,
      paymentIntentId: session.payment_intent as string,
    };
  }

  /**
   * Gera um link de onboarding do Stripe Connect para o profissional
   */
  async getOnboardingLink(userId: string): Promise<string> {
    let user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    if (!user.stripeAccountId) {
      const account = await this.stripe.accounts.create({
        type: 'express',
        country: 'BR',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      user.stripeAccountId = account.id;
      await this.userRepo.save(user);
    }

    const accountLink = await this.stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/perfil?stripe=refresh`,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/perfil?stripe=success`,
      type: 'account_onboarding',
    });

    return accountLink.url;
  }

  /**
   * Recebe e processa webhooks assíncronos do Mercado Pago
   */
  async handleWebhook(event: any) {
    this.logger.log(`Webhook recebido do Mercado Pago: ${JSON.stringify(event)}`);
    // Em produção, isso bateria na API do MP para validar o status real da transação
    // E então chamaria BookingsService para confirmar a reserva.
    return { received: true };
  }

  /**
   * Cria uma sessão de checkout para assinatura de plano (SaaS)
   */
  async createSubscriptionCheckout(userId: string, priceId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    // Create a pending subscription in our DB
    const subscription = this.subscriptionRepo.create({
      userId,
      planName: 'Premium Plan', // In a real scenario, fetch name based on priceId
      status: SubscriptionStatus.PENDING,
    });
    await this.subscriptionRepo.save(subscription);
    
    // Create Stripe checkout session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      metadata: {
        userId: userId,
      },
      customer_email: user.email, // Can use customer if we have stripeCustomerId
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/perfil?subscription_success=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/perfil?subscription_canceled=true`,
    };

    const session = await this.stripe.checkout.sessions.create(sessionConfig);
    
    // Better way to save subscription: We need it to be synchronously saved so webhook finds it, 
    // or we can just rely on the webhook to create/update based on userId in metadata.
    // Relying on webhook is safer for subscriptions since Stripe creates the subscription object.
    
    return {
      checkoutUrl: session.url,
    };
  }

  /**
   * Ativa uma assinatura após o checkout
   */
  async activateSubscription(userId: string, subscriptionId: string) {
    // Acha a subscription pendente do usuário
    const sub = await this.subscriptionRepo.findOne({
      where: { userId, status: SubscriptionStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
    
    if (sub) {
      sub.status = SubscriptionStatus.ACTIVE;
      sub.externalSubscriptionId = subscriptionId;
      await this.subscriptionRepo.save(sub);
      this.logger.log(`Assinatura ativada para o user ${userId}`);
    }
  }

  /**
   * Atualiza uma assinatura (renovação)
   */
  async updateSubscription(subscriptionId: string, currentPeriodEnd: number) {
    const sub = await this.subscriptionRepo.findOneBy({ externalSubscriptionId: subscriptionId });
    if (sub) {
      sub.currentPeriodEnd = new Date(currentPeriodEnd * 1000);
      sub.status = SubscriptionStatus.ACTIVE;
      await this.subscriptionRepo.save(sub);
    }
  }

  /**
   * Cancela uma assinatura
   */
  async cancelSubscription(subscriptionId: string) {
    const sub = await this.subscriptionRepo.findOneBy({ externalSubscriptionId: subscriptionId });
    if (sub) {
      sub.status = SubscriptionStatus.CANCELED;
      await this.subscriptionRepo.save(sub);
      this.logger.log(`Assinatura cancelada: ${subscriptionId}`);
    }
  }
}
