import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QRCharge } from './entities/qr-charge.entity';
import { CreateQrChargeDto } from './dto/create-qr-charge.dto';

@Injectable()
export class QRService {
  constructor(
    @InjectRepository(QRCharge)
    private readonly qrRepo: Repository<QRCharge>,
  ) {}

  async createQrCharge(providerId: string, dto: CreateQrChargeDto) {
    const expiresAt =
      dto.expiresInMinutes && dto.expiresInMinutes > 0
        ? new Date(Date.now() + dto.expiresInMinutes * 60 * 1000)
        : null;

    const charge = this.qrRepo.create({
      providerId,
      amount: dto.amount.toFixed(2),
      currency: 'BRL',
      description: dto.description,
      expiresAt,
      status: 'PENDING',
    } as Partial<QRCharge>);

    const saved: QRCharge = await this.qrRepo.save(charge);

    return {
      qr_charge_id: saved.id,
      provider_id: saved.providerId,
      amount: Number(saved.amount),
      currency: saved.currency,
      description: saved.description,
      status: saved.status,
      expires_at: saved.expiresAt,
      qr_payload: `conexaofitness://qrcharge/${saved.id}`,
    };
  }

  async getQrCharge(id: string) {
    const charge = await this.qrRepo.findOne({ where: { id } });
    if (!charge) {
      return null;
    }

    return {
      qr_charge_id: charge.id,
      provider_id: charge.providerId,
      amount: Number(charge.amount),
      currency: charge.currency,
      description: charge.description,
      status: charge.status,
      expires_at: charge.expiresAt,
    };
  }

  async markAsPaid(id: string) {
    const charge = await this.qrRepo.findOne({ where: { id } });
    if (!charge || charge.status !== 'PENDING') {
      throw new Error('QRCharge inválido ou já processado');
    }
    charge.status = 'PAID';
    charge.updatedAt = new Date();
    return this.qrRepo.save(charge);
  }
}