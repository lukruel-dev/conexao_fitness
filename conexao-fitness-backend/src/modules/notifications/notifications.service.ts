import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async create(userId: string, title: string, message: string, type: NotificationType, referenceId?: string) {
    const notification = this.notificationRepo.create({
      userId,
      title,
      message,
      type,
      referenceId,
    });
    return this.notificationRepo.save(notification);
  }

  async createNotification(data: {
    userId: string;
    title: string;
    message?: string;
    content?: string;
    type?: string | NotificationType;
    referenceId?: string;
  }) {
    let resolvedType = NotificationType.INFO;
    if (
      data.type === NotificationType.BOOKING ||
      data.type === 'BOOKING' ||
      data.type === 'BOOKING_CONFIRMED' ||
      data.type === 'NEW_BOOKING'
    ) {
      resolvedType = NotificationType.BOOKING;
    } else if (data.type === NotificationType.CHAT || data.type === 'CHAT') {
      resolvedType = NotificationType.CHAT;
    }

    return this.create(
      data.userId,
      data.title,
      data.content || data.message || '',
      resolvedType,
      data.referenceId,
    );
  }

  async findAllForUser(userId: string) {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getUnreadCount(userId: string) {
    return this.notificationRepo.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notificação não encontrada');
    }
    notification.isRead = true;
    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }
}
