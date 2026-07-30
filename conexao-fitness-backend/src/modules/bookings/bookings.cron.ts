import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class BookingsCron {
  private readonly logger = new Logger(BookingsCron.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepo: Repository<Booking>,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Roda a cada hora (no minuto 0).
   * Encontra todas as reservas CONFIRMED cuja data/hora de término já passou.
   * Marca como COMPLETED e libera o saldo (Escrow) na carteira do profissional.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async releaseEscrowBalances() {
    this.logger.log('Iniciando verificação de Escrow release...');
    
    // Precisamos de reservas CONFIRMED que já terminaram.
    // O término de uma reserva é slot.startsAt + service.durationMinutes.
    // Como SQL para somar intervalo pode ser complexo (embora no Postgres seja fácil com INTERVAL),
    // podemos simplificar puxando as reservas confirmadas cujo 'startsAt' foi a mais de 2 horas atrás,
    // garantindo que a aula já acabou (mesmo as de 1h30).
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const pastBookings = await this.bookingsRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.slot', 'slot')
      .leftJoinAndSelect('booking.service', 'service')
      .where('booking.status = :status', { status: BookingStatus.CONFIRMED })
      .andWhere('slot.startsAt <= :time', { time: twoHoursAgo })
      .getMany();

    if (pastBookings.length === 0) {
      this.logger.log('Nenhuma reserva pendente de liberação de Escrow.');
      return;
    }

    this.logger.log(`Encontradas ${pastBookings.length} reservas para liberação.`);

    for (const booking of pastBookings) {
      try {
        const price = Number(booking.service.price);
        
        // Libera o saldo retido para o provedor
        await this.walletService.releasePendingBalance(booking.service.providerId, price);
        
        // Atualiza status da reserva para COMPLETED
        booking.status = BookingStatus.COMPLETED;
        await this.bookingsRepo.save(booking);

        this.logger.log(`Escrow de ${price} liberado para Provider ${booking.service.providerId} referente ao Booking ${booking.id}`);
      } catch (err: any) {
        this.logger.error(`Erro ao liberar escrow da reserva ${booking.id}: ${err.message}`, err.stack);
      }
    }
  }
}
