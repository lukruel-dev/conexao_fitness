import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { OAuthAuthDto } from './dto/oauth-auth.dto';
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
    let fullUser = user;
    if (!fullUser.personalProfile && !fullUser.academiaProfile && fullUser.id) {
      const loaded = await this.usersService.findOne(fullUser.id);
      if (loaded) fullUser = loaded;
    }

    const payload = { email: fullUser.email, sub: fullUser.id, role: fullUser.role };
    
    // Buscar a assinatura mais recente (ativa)
    const activeSub = await this.subscriptionRepo.findOne({
      where: { userId: fullUser.id, status: SubscriptionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
    
    const planName = activeSub?.planName || 'Gratuito';

    const documentUrl = fullUser.personalProfile?.documentUrl || fullUser.academiaProfile?.documentUrl || undefined;
    const cref = fullUser.personalProfile?.cref || undefined;

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: fullUser.id,
        name: fullUser.name,
        email: fullUser.email,
        role: fullUser.role,
        status: fullUser.status,
        avatarUrl: fullUser.avatarUrl,
        planName,
        documentUrl,
        cref,
        kycRejectionReason: fullUser.kycRejectionReason,
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

    const documentUrl = user.personalProfile?.documentUrl || user.academiaProfile?.documentUrl || undefined;
    const cref = user.personalProfile?.cref || undefined;

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
        professionTitle,
        planName,
        documentUrl,
        cref,
        kycRejectionReason: user.kycRejectionReason,
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

  async oauthLoginOrRegister(dto: OAuthAuthDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      if (existingUser.status === 'SUSPENSO') {
        throw new UnauthorizedException('Conta suspensa. Entre em contato com o suporte.');
      }
      if (dto.avatarUrl && existingUser.avatarUrl !== dto.avatarUrl) {
        await this.usersService.updateAvatar(existingUser.id, dto.avatarUrl);
        existingUser.avatarUrl = dto.avatarUrl;
      }
      return this.login(existingUser);
    }

    const selectedRole = dto.role || 'STUDENT';

    // Se for PERSONAL ou ACADEMIA e ainda faltar dados obrigatórios
    if (selectedRole === 'PERSONAL') {
      const hasRequiredFields = !!(dto.professionTitle && dto.professionalRegistrationId && dto.cpf);
      if (!hasRequiredFields) {
        return {
          requiresAdditionalData: true,
          provider: dto.provider,
          email: dto.email,
          name: dto.name,
          avatarUrl: dto.avatarUrl,
          role: 'PERSONAL',
        };
      }
    } else if (selectedRole === 'ACADEMIA') {
      const hasRequiredFields = !!(dto.cnpj || dto.cpf);
      if (!hasRequiredFields) {
        return {
          requiresAdditionalData: true,
          provider: dto.provider,
          email: dto.email,
          name: dto.name,
          avatarUrl: dto.avatarUrl,
          role: 'ACADEMIA',
        };
      }
    }

    // Gerar uma senha segura interna para a conta OAuth
    const dummyPassword = `OAuth_${dto.provider}_${Math.random().toString(36).slice(2)}_${Date.now()}`;

    const createdUser = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: dummyPassword,
      role: selectedRole,
      avatarUrl: dto.avatarUrl,
      cpf: dto.cpf,
      cnpj: dto.cnpj,
      razaoSocial: dto.razaoSocial,
      nomeFantasia: dto.nomeFantasia,
      phone: dto.phone,
      professionTitle: dto.professionTitle,
      professionalRegistrationId: dto.professionalRegistrationId,
      professionalDocumentUrl: dto.professionalDocumentUrl,
    });

    return this.login(createdUser);
  }
}
