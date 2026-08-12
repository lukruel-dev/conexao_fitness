import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../payments/entities/subscription.entity';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(pass, user.passwordHash)) {
      if (user.status === 'SUSPENSO') {
        throw new UnauthorizedException('Conta suspensa. Entre em contato com o suporte.');
      }
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    
    // Buscar a assinatura mais recente (ativa)
    const activeSub = await this.subscriptionRepo.findOne({
      where: { userId: user.id, status: SubscriptionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
    
    // Se não tiver assinatura ativa, vamos assumir o plano base "Gratuito" ou a pendente.
    // Para fins do novo modelo de planos, todos começam no "Gratuito" se não assinarem.
    const planName = activeSub?.planName || 'Gratuito';

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        planName,
      }
    };
  }

  async getUserProfile(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const activeSub = await this.subscriptionRepo.findOne({
      where: { userId: user.id, status: SubscriptionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
    
    const planName = activeSub?.planName || 'Gratuito';

    let professionTitle: string | undefined = undefined;
    if (user.personalProfile) {
        professionTitle = user.personalProfile.professionTitle;
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        professionTitle,
        planName,
    };
  }

  async register(dto: CreateUserDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Este e-mail já está em uso.');
    }
    const user = await this.usersService.create(dto);
    return this.login(user);
  }
}
