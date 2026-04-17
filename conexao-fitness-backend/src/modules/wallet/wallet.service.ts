import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletAccount } from './entities/wallet-account.entity';
import { PaymentIntent } from './entities/payment-intent.entity';
import { CreateTopupDto } from './dto/create-topup.dto';
import { QRService } from '../qr/qr.service';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(WalletAccount)
    private readonly walletRepo: Repository<WalletAccount>,
    @InjectRepository(PaymentIntent)
    private readonly paymentIntentRepo: Repository<PaymentIntent>,
    private readonly qrService: QRService,
  ) {}

  async getMyBalance(userId: string) {
    let wallet = await this.walletRepo.findOne({
      where: { ownerId: userId, ownerType: 'USER' },
    });

    if (!wallet) {
      wallet = this.walletRepo.create({
        ownerId: userId,
        ownerType: 'USER',
        currency: 'BRL',
        currentBalance: '0.00',
        status: 'ACTIVE',
      });
      wallet = await this.walletRepo.save(wallet);
    }

    return {
      wallet_account_id: wallet.id,
      currency: wallet.currency,
      current_balance: Number(wallet.currentBalance),
    };
  }

  async createTopup(userId: string, dto: CreateTopupDto) {
    const intent = this.paymentIntentRepo.create({
      payerUserId: userId,
      amount: dto.amount.toFixed(2),
      currency: 'BRL',
      method: dto.method,
      purpose: 'WALLET_TOPUP',
      status: 'PENDING',
    });

    const saved = await this.paymentIntentRepo.save(intent);

    return {
      payment_intent_id: saved.id,
      amount: Number(saved.amount),
      currency: saved.currency,
      method: saved.method,
      status: saved.status,
    };
  }

  async simulateTopupSuccess(paymentIntentId: string) {
    const intent = await this.paymentIntentRepo.findOne({
      where: { id: paymentIntentId },
    });

    if (!intent || intent.status !== 'PENDING') {
      throw new Error('PaymentIntent inválido ou já processado');
    }

    intent.status = 'SUCCEEDED';
    intent.updatedAt = new Date();
    await this.paymentIntentRepo.save(intent);

    const amountNumber = Number(intent.amount);
    await this.getMyBalance(intent.payerUserId);

    const wallet = await this.walletRepo.findOneOrFail({
      where: { ownerId: intent.payerUserId, ownerType: 'USER' },
    });

    const newBalance = Number(wallet.currentBalance) + amountNumber;
    wallet.currentBalance = newBalance.toFixed(2);
    await this.walletRepo.save(wallet);

    return {
      payment_intent_id: intent.id,
      status: intent.status,
      new_balance: newBalance,
    };
  }

  async payQrWithCredits(userId: string, qrChargeId: string) {
    const qr = await this.qrService.getQrCharge(qrChargeId);
    if (!qr) {
      throw new Error('QRCharge não encontrado');
    }

    if (qr.status !== 'PENDING') {
      throw new Error('QRCharge já processado ou inválido');
    }

    if (qr.expires_at && new Date(qr.expires_at) < new Date()) {
      throw new Error('QRCharge expirado');
    }

    const amount = Number(qr.amount);

    const balanceInfo = await this.getMyBalance(userId);
    if (balanceInfo.current_balance < amount) {
      throw new Error('Saldo insuficiente na carteira');
    }

    const wallet = await this.walletRepo.findOneOrFail({
      where: { ownerId: userId, ownerType: 'USER' },
    });

    const newBalance = Number(wallet.currentBalance) - amount;
    wallet.currentBalance = newBalance.toFixed(2);
    await this.walletRepo.save(wallet);

    await this.qrService.markAsPaid(qrChargeId);

    return {
      qr_charge_id: qrChargeId,
      paid_amount: amount,
      new_balance: newBalance,
    };
  }
}
