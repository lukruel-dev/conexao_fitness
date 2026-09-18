import { Injectable, ConflictException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { OAuthAuthDto } from './dto/oauth-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../payments/entities/subscription.entity';
import { EmailService } from '../notifications/email.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { SendVerificationCodeDto } from './dto/send-verification-code.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    if (user.passwordHash?.includes('TempPasswordHash')) {
      throw new UnauthorizedException(
        'Sua matrícula foi realizada no balcão da academia! Acesse a tela de Criar Conta para cadastrar sua senha pessoal com este e-mail.',
      );
    }

    if (await bcrypt.compare(pass, user.passwordHash)) {
      if (user.status === 'SUSPENSO') {
        throw new UnauthorizedException('Conta suspensa. Entre em contato com o suporte.');
      }

      // Se a conta for nova e possui código de verificação pendente, exige confirmação
      if (user.isEmailVerified === false && user.emailVerificationCode) {
        // Se o código anterior expirou, gera um novo automaticamente
        if (!user.emailVerificationExpiresAt || new Date() > user.emailVerificationExpiresAt) {
          const newCode = Math.floor(100000 + Math.random() * 900000).toString();
          user.emailVerificationCode = newCode;
          user.emailVerificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
          await this.usersService.save(user);
          this.emailService.sendVerificationCode(user.email, user.name, newCode).catch(() => {});
        }

        throw new UnauthorizedException({
          statusCode: 401,
          code: 'EMAIL_NOT_VERIFIED',
          email: user.email,
          message: 'Seu e-mail ainda não foi verificado. Enviamos um código para sua caixa de entrada.',
        });
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
    const crn = fullUser.personalProfile?.crn || undefined;
    const professionTitle = fullUser.personalProfile?.professionTitle || undefined;
    const bio = fullUser.personalProfile?.bio || fullUser.bio || undefined;

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: fullUser.id,
        name: fullUser.name,
        email: fullUser.email,
        role: fullUser.role,
        status: fullUser.status,
        isEmailVerified: fullUser.isEmailVerified ?? true,
        avatarUrl: fullUser.avatarUrl,
        professionTitle,
        planName,
        documentUrl,
        cref,
        crn,
        bio,
        cityBase: fullUser.cityBase,
        phone: fullUser.phone,
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
    let crn: string | undefined = undefined;
    if (user.personalProfile) {
        professionTitle = user.personalProfile.professionTitle;
        crn = user.personalProfile.crn;
    }

    const documentUrl = user.personalProfile?.documentUrl || user.academiaProfile?.documentUrl || undefined;
    const cref = user.personalProfile?.cref || undefined;
    const bio = user.personalProfile?.bio || user.bio || undefined;

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isEmailVerified: user.isEmailVerified ?? true,
        avatarUrl: user.avatarUrl,
        professionTitle,
        planName,
        documentUrl,
        cref,
        crn,
        bio,
        cityBase: user.cityBase,
        phone: user.phone,
        kycRejectionReason: user.kycRejectionReason,
    };
  }

  async register(dto: CreateUserDto) {
    let existingUser = await this.usersService.findByEmail(dto.email);

    if (!existingUser && dto.cpf) {
      const cleanCpf = dto.cpf.replace(/\D/g, '');
      if (cleanCpf) {
        existingUser = await this.usersService.findByCpf(cleanCpf);
      }
    }

    if (existingUser) {
      const isTemporaryAccount = existingUser.passwordHash?.includes('TempPasswordHash');
      if (isTemporaryAccount) {
        const salt = await bcrypt.genSalt(10);
        existingUser.passwordHash = await bcrypt.hash(dto.password, salt);

        // Se era email temporário e agora o aluno informou o email real
        if (dto.email && dto.email.includes('@') && !dto.email.endsWith('.temp')) {
          existingUser.email = dto.email.toLowerCase().trim();
        }

        if (dto.name && (!existingUser.name || existingUser.name.startsWith('Aluno '))) {
          existingUser.name = dto.name;
        }
        if (dto.avatarUrl && !existingUser.avatarUrl) {
          existingUser.avatarUrl = dto.avatarUrl;
        }
        if (dto.cpf && !existingUser.cpf) {
          existingUser.cpf = dto.cpf.replace(/\D/g, '');
        }
        if (dto.phone && !existingUser.phone) {
          existingUser.phone = dto.phone.replace(/\D/g, '');
        }
        if (existingUser.status === 'PENDENTE_KYC') {
          existingUser.status = 'ATIVO';
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        existingUser.isEmailVerified = false;
        existingUser.emailVerificationCode = verificationCode;
        existingUser.emailVerificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

        const updatedUser = await this.usersService.save(existingUser);

        this.emailService.sendVerificationCode(updatedUser.email, updatedUser.name, verificationCode).catch((err) => {
          console.error('Erro ao enviar e-mail de verificação no cadastro balcão:', err);
        });

        return {
          requiresEmailVerification: true,
          email: updatedUser.email,
          name: updatedUser.name,
          message: 'Matrícula ativada! Enviamos um código de 6 dígitos para o seu e-mail.',
        };
      }

      throw new ConflictException('Este e-mail já está em uso.');
    }

    const user = await this.usersService.create(dto);

    // Gerar código OTP de 6 dígitos e salvar
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.isEmailVerified = false;
    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await this.usersService.save(user);

    // Enviar código por e-mail em segundo plano
    this.emailService.sendVerificationCode(user.email, user.name, verificationCode).catch((err) => {
      console.error('Erro ao enviar e-mail de verificação no cadastro:', err);
    });

    return {
      requiresEmailVerification: true,
      email: user.email,
      name: user.name,
      message: 'Cadastro realizado com sucesso! Enviamos um código de 6 dígitos para o seu e-mail.',
    };
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
    const cleanDoc = (dto.cpf || dto.cnpj || '').replace(/\D/g, '');

    // Para TODOS os perfis (STUDENT, PERSONAL, ACADEMIA), CPF/CNPJ e Foto de Perfil são obrigatórios
    if (!cleanDoc || !dto.avatarUrl) {
      return {
        requiresAdditionalData: true,
        provider: dto.provider,
        email: dto.email,
        name: dto.name,
        avatarUrl: dto.avatarUrl,
        role: selectedRole,
      };
    }

    // Se for PERSONAL e faltar dados profissionais
    if (selectedRole === 'PERSONAL') {
      const hasRequiredFields = !!(dto.professionTitle && dto.professionalRegistrationId && cleanDoc);
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

    // Contas criadas com OAuth já possuem e-mail validado
    createdUser.isEmailVerified = true;
    await this.usersService.save(createdUser);

    return this.login(createdUser);
  }

  /**
   * Valida o código OTP de 6 dígitos enviado por e-mail e autentica o usuário
   */
  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado com este e-mail.');
    }

    if (user.isEmailVerified) {
      return this.login(user);
    }

    if (!user.emailVerificationCode || user.emailVerificationCode !== dto.code.trim()) {
      throw new BadRequestException('Código de verificação incorreto ou inválido.');
    }

    if (user.emailVerificationExpiresAt && new Date() > user.emailVerificationExpiresAt) {
      throw new BadRequestException('Código de verificação expirado. Solicite um novo código.');
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = null as any;
    user.emailVerificationExpiresAt = null as any;
    await this.usersService.save(user);

    return this.login(user);
  }

  /**
   * Reenvia um código de verificação novo para o e-mail
   */
  async resendVerificationCode(dto: SendVerificationCodeDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado com este e-mail.');
    }

    if (user.isEmailVerified) {
      return { success: true, message: 'Este e-mail já está verificado.' };
    }

    // Cooldown de 60 segundos para evitar disparos repetidos
    if (user.emailVerificationExpiresAt) {
      const now = Date.now();
      const expiresAt = new Date(user.emailVerificationExpiresAt).getTime();
      const createdAt = expiresAt - 15 * 60 * 1000;
      if (now - createdAt < 60 * 1000) {
        const remainingSecs = Math.ceil((60 * 1000 - (now - createdAt)) / 1000);
        throw new BadRequestException(`Aguarde ${remainingSecs} segundos para solicitar um novo código.`);
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationCode = code;
    user.emailVerificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await this.usersService.save(user);

    await this.emailService.sendVerificationCode(user.email, user.name, code);
    return { success: true, message: 'Novo código de verificação enviado com sucesso!' };
  }

  /**
   * Solicita recuperação de senha e envia código de 6 dígitos para o e-mail
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    // Para segurança contra enumeração de e-mails, retornamos sucesso genérico mesmo se não existir
    if (!user) {
      return { success: true, message: 'Se este e-mail estiver cadastrado, as instruções foram enviadas.' };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetToken = code;
    user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
    await this.usersService.save(user);

    this.emailService.sendPasswordResetEmail(user.email, user.name, code).catch((err) => {
      console.error('Erro ao enviar e-mail de recuperação de senha:', err);
    });

    return { success: true, message: 'Código de recuperação enviado para o seu e-mail.' };
  }

  /**
   * Valida código de recuperação e atualiza a senha da conta
   */
  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (!user.passwordResetToken || user.passwordResetToken !== dto.code.trim()) {
      throw new BadRequestException('Código de recuperação inválido ou incorreto.');
    }

    if (user.passwordResetExpiresAt && new Date() > user.passwordResetExpiresAt) {
      throw new BadRequestException('Código de recuperação expirado. Solicite um novo.');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(dto.newPassword, salt);
    user.passwordResetToken = null as any;
    user.passwordResetExpiresAt = null as any;
    // O usuário acabou de comprovar a posse do e-mail
    user.isEmailVerified = true;
    await this.usersService.save(user);

    return { success: true, message: 'Senha redefinida com sucesso! Você já pode fazer login.' };
  }
}
