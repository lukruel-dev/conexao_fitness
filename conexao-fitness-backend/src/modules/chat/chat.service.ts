import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../notifications/email.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Envia uma mensagem em um agendamento
   */
  async sendMessage(bookingId: string, senderId: string, content: string): Promise<Message> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['service'],
    });
    
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Apenas quem participa da reserva pode enviar mensagens
    if (booking.studentId !== senderId && booking.service.providerId !== senderId) {
      throw new ForbiddenException('You are not part of this booking');
    }

    // Apenas reservas confirmadas podem ter chat
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new ForbiddenException('Chat is only available for CONFIRMED bookings');
    }

    // Filtro de Segurança (Regex)
    // Censurar Pix, números de 8 a 11 dígitos, etc.
    let safeContent = content;
    
    // Substitui palavras-chave relacionadas a pagamentos por fora
    const paymentRegex = /\b(pix|transferência|deposito|depósito|whatsapp|whats|zap)\b/gi;
    safeContent = safeContent.replace(paymentRegex, '[BLOQUEADO PELO SISTEMA]');

    // Substitui sequências de 8 a 11 números (possível telefone)
    const phoneRegex = /\b\d{8,11}\b/g;
    safeContent = safeContent.replace(phoneRegex, '[BLOQUEADO PELO SISTEMA]');
    
    // Telefone formatado ex: (11) 99999-9999
    const formattedPhoneRegex = /\(?\d{2}\)?\s?\d{4,5}-?\d{4}/g;
    safeContent = safeContent.replace(formattedPhoneRegex, '[BLOQUEADO PELO SISTEMA]');

    const message = this.messageRepo.create({
      bookingId,
      senderId,
      content: safeContent,
    });

    const savedMessage = await this.messageRepo.save(message);

    // Send notifications
    setTimeout(async () => {
      try {
        const recipientId = booking.studentId === senderId ? booking.service.providerId : booking.studentId;
        const sender = await this.userRepo.findOneBy({ id: senderId });
        const recipient = await this.userRepo.findOneBy({ id: recipientId });

        if (recipient && sender) {
          await this.notificationsService.create(
            recipient.id,
            'Nova Mensagem',
            `Você tem uma nova mensagem de ${sender.name} sobre o agendamento de ${booking.service.name}.`,
            NotificationType.CHAT,
          );
          
          await this.emailService.sendEmail(
            recipient.email,
            'Nova Mensagem Recebida',
            `<p><strong>${sender.name}</strong> enviou uma mensagem sobre o agendamento de <strong>${booking.service.name}</strong>.</p><p>Abra o app para responder.</p>`,
          );
        }
      } catch (e) {
        console.error('Erro ao notificar nova mensagem de chat', e);
      }
    }, 0);

    return savedMessage;
  }

  /**
   * Retorna as mensagens de um agendamento
   */
  async getMessages(bookingId: string, userId: string): Promise<Message[]> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['service'],
    });
    
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.studentId !== userId && booking.service.providerId !== userId) {
      throw new ForbiddenException('You are not part of this booking');
    }

    return this.messageRepo.find({
      where: { bookingId },
      order: { createdAt: 'ASC' },
    });
  }
}
