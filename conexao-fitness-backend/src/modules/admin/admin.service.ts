import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
    user.kycRejectionReason = null as any;
    return this.usersRepo.save(user);
  }

  async rejectKyc(userId: string, reason: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    user.status = 'KYC_REJEITADO'; 
    user.kycRejectionReason = reason;
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
    const query = this.usersRepo.createQueryBuilder('user')
      .leftJoinAndSelect('user.personalProfile', 'personalProfile')
      .leftJoinAndSelect('user.academiaProfile', 'academiaProfile');
    
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

  async deleteUser(userId: string, currentAdminId?: string): Promise<{ success: boolean; message: string }> {
    if (currentAdminId && userId === currentAdminId) {
      throw new BadRequestException('Não é possível excluir o próprio usuário administrador logado.');
    }
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const entityManager = this.usersRepo.manager;

    await entityManager.transaction(async (manager) => {
      // 1. Limpa avaliações (como aluno ou como prestador)
      await manager.query(`DELETE FROM "reviews" WHERE "studentId" = $1 OR "providerId" = $1`, [userId]).catch(() => {});

      // 2. Limpa mensagens do chat enviadas pelo usuário
      await manager.query(`DELETE FROM "messages" WHERE "senderId" = $1`, [userId]).catch(() => {});

      // 3. Limpa disponibilidades cadastradas do profissional
      await manager.query(`DELETE FROM "provider_availabilities" WHERE "providerId" = $1`, [userId]).catch(() => {});

      // 4. Limpa assinaturas ativas/pendentes
      await manager.query(`DELETE FROM "subscriptions" WHERE "userId" = $1`, [userId]).catch(() => {});

      // 5. Limpa notificações do usuário
      await manager.query(`DELETE FROM "notifications" WHERE "userId" = $1`, [userId]).catch(() => {});

      // 6. Limpa dados financeiros (carteira, cobranças QR, intents)
      await manager.query(`DELETE FROM "payment_intents" WHERE "payerUserId" = $1`, [userId]).catch(() => {});
      await manager.query(`DELETE FROM "wallet_accounts" WHERE "owner_id" = $1`, [userId]).catch(() => {});
      await manager.query(`DELETE FROM "qr_charges" WHERE "providerId" = $1`, [userId]).catch(() => {});

      // 7. Remove serviços prestados pelo usuário (o TypeORM faz cascade em schedule_slots e bookings)
      const userServices = await manager.find(Service, { where: { providerId: userId } });
      for (const service of userServices) {
        await manager.delete(Service, service.id);
      }

      // 8. Remove agendamentos feitos pelo usuário como aluno
      await manager.delete(Booking, { student: { id: userId } });

      // 9. Remove perfis
      await manager.query(`DELETE FROM "personal_profiles" WHERE "user_id" = $1`, [userId]).catch(() => {});
      await manager.query(`DELETE FROM "academia_profiles" WHERE "user_id" = $1`, [userId]).catch(() => {});
      await manager.query(`DELETE FROM "aluno_profiles" WHERE "user_id" = $1`, [userId]).catch(() => {});

      // 10. Remove o usuário principal
      await manager.delete(User, userId);
    });

    return { success: true, message: 'Usuário excluído com sucesso' };
  }

  async findAllSubscriptions(): Promise<Subscription[]> {
    return this.subscriptionsRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}
