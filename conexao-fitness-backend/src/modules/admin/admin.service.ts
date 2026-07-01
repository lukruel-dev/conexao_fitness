import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { Service } from '../services/entities/service.entity';
import { Subscription, SubscriptionStatus } from '../payments/entities/subscription.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Booking)
    private readonly bookingsRepo: Repository<Booking>,
    @InjectRepository(Service)
    private readonly servicesRepo: Repository<Service>,
    @InjectRepository(Subscription)
    private readonly subscriptionsRepo: Repository<Subscription>,
  ) {}

  async approveKyc(userId: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    user.status = 'ATIVO';
    return this.usersRepo.save(user);
  }

  async rejectKyc(userId: string, reason: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    user.status = 'PENDENTE_KYC'; 
    return this.usersRepo.save(user);
  }

  async getDashboardMetrics() {
    const totalUsers = await this.usersRepo.count();
    const activeSubscriptions = await this.subscriptionsRepo.count({ where: { status: SubscriptionStatus.ACTIVE } });
    const totalBookings = await this.bookingsRepo.count({ where: { status: BookingStatus.CONFIRMED } });
    const totalServices = await this.servicesRepo.count();

    return {
      totalUsers,
      activeSubscriptions,
      totalBookings,
      totalServices,
    };
  }

  async findAllUsers(role?: UserRole, status?: UserStatus): Promise<User[]> {
    const query = this.usersRepo.createQueryBuilder('user');
    
    if (role) {
      query.andWhere('user.role = :role', { role });
    }
    
    if (status) {
      query.andWhere('user.status = :status', { status });
    }

    return query.getMany();
  }

  async findAllBookings(status?: BookingStatus): Promise<Booking[]> {
    const query = this.bookingsRepo.createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.slot', 'slot')
      .leftJoinAndSelect('booking.student', 'student')
      .orderBy('booking.createdAt', 'DESC');

    if (status) {
      query.andWhere('booking.status = :status', { status });
    }

    return query.getMany();
  }

  async suspendUser(userId: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    user.status = 'SUSPENSO';
    return this.usersRepo.save(user);
  }

  async activateUser(userId: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    user.status = 'ATIVO';
    return this.usersRepo.save(user);
  }
}
