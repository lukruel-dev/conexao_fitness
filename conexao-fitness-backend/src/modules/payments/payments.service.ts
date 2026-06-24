import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly PLATFORM_FEE_PERCENTAGE = 0.10; // 10% do MVP

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
  ) {}

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
   * Cria uma sessão de checkout no Mercado Pago (Mock para o MVP estrutural)
   */
  async createCheckoutSessionForBooking(bookingId: string, amount: number, providerId: string) {
    this.logger.log(`Criando sessão do Mercado Pago para o booking ${bookingId}`);
    
    const { platformFee, providerAmount } = this.calculateSplit(amount);
    
    this.logger.log(`Split configurado - Total: ${amount} | Plataforma: ${platformFee} | Provider (${providerId}): ${providerAmount}`);

    return {
      checkoutUrl: `https://sandbox.mercadopago.com.br/checkout/pay?pref_id=mock_${bookingId}`,
      paymentIntentId: `mp_intent_${Date.now()}`,
    };
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
}
