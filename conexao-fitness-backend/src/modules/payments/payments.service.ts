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
   * Helper to get or create a Stripe Customer for a User
   */
  async getOrCreateCustomer(user: User): Promise<string> {
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }
    const customer = await this.stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });
    user.stripeCustomerId = customer.id;
    await this.userRepo.save(user);
    return customer.id;
  }

  /**
   * Cria uma intenção de pagamento no Stripe (Split Payment)
   */
  async createPaymentIntentForBooking(bookingId: string, amount: number, providerId: string) {
    this.logger.log(`Criando PaymentIntent do Stripe para o booking ${bookingId}`);
    
    const provider = await this.userRepo.findOneBy({ id: providerId });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    if (!provider.stripeAccountId && process.env.NODE_ENV === 'production') {
      throw new BadRequestException('O profissional ainda não configurou sua conta de recebimento (Stripe Connect).');
    }

    const { platformFee, providerAmount } = this.calculateSplit(amount);
    
    const amountInCents = Math.round(amount * 100);
    const platformFeeInCents = Math.round(platformFee * 100);

    const intentConfig: Stripe.PaymentIntentCreateParams = {
      amount: amountInCents,
      currency: 'brl',
      metadata: {
        bookingId: bookingId,
        purpose: 'BOOKING'
      },
    };

    if (provider.stripeAccountId && provider.stripeAccountId.startsWith('acct_')) {
      intentConfig.application_fee_amount = platformFeeInCents;
      intentConfig.transfer_data = {
        destination: provider.stripeAccountId,
      };
    }

    const paymentIntent = await this.stripe.paymentIntents.create(intentConfig);

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
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

  async handleWebhook(event: any) {
    this.logger.log(`Webhook recebido do Mercado Pago: ${JSON.stringify(event)}`);
    return { received: true };
  }

  /**
   * Cria uma assinatura incompleta para retornar client_secret
   */
  async createSubscriptionPaymentIntent(userId: string, priceId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    const customerId = await this.getOrCreateCustomer(user);

    const subscription = this.subscriptionRepo.create({
      userId,
      planName: 'Premium Plan',
      status: SubscriptionStatus.PENDING,
    });
    await this.subscriptionRepo.save(subscription);
    
    const stripeSub = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: { userId },
    });
    
    const invoice = stripeSub.latest_invoice as any;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    return {
      clientSecret: paymentIntent.client_secret,
      subscriptionId: stripeSub.id,
    };
  }

  /**
   * Cria um PaymentIntent para recarga da carteira
   */
  async createPaymentIntentForTopup(userId: string, topupIntentId: string, amount: number) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    const amountInCents = Math.round(amount * 100);

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'brl',
        metadata: {
          paymentIntentId: topupIntentId,
          userId,
          purpose: 'WALLET_TOPUP',
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (err: any) {
      this.logger.warn(`Stripe topup error fallback: ${err.message}`);
      return {
        clientSecret: `pi_mock_${topupIntentId}_secret_mock`,
        paymentIntentId: `pi_mock_${topupIntentId}`,
      };
    }
  }

  async activateSubscription(userId: string, subscriptionId: string) {
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

  async updateSubscription(subscriptionId: string, currentPeriodEnd: number) {
    const sub = await this.subscriptionRepo.findOneBy({ externalSubscriptionId: subscriptionId });
    if (sub) {
      sub.currentPeriodEnd = new Date(currentPeriodEnd * 1000);
      sub.status = SubscriptionStatus.ACTIVE;
      await this.subscriptionRepo.save(sub);
    }
  }

  async cancelSubscription(subscriptionId: string) {
    const sub = await this.subscriptionRepo.findOneBy({ externalSubscriptionId: subscriptionId });
    if (sub) {
      sub.status = SubscriptionStatus.CANCELED;
      await this.subscriptionRepo.save(sub);
      this.logger.log(`Assinatura cancelada: ${subscriptionId}`);
    }
  }
}
