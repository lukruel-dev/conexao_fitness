import { BadRequestException, Injectable, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { PersonalProfile } from './entities/personal-profile.entity';
import { AcademiaProfile } from './entities/academia-profile.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreatePersonalProfileDto } from './dto/create-personal-profile.dto';
import { UpdatePersonalProfileDto } from './dto/update-personal-profile.dto';
import { CreateAcademiaProfileDto } from './dto/create-academia-profile.dto';
import { validateBioContent } from '../../common/utils/bio-validator';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(PersonalProfile)
    private readonly personalProfileRepo: Repository<PersonalProfile>,
    @InjectRepository(AcademiaProfile)
    private readonly academiaProfileRepo: Repository<AcademiaProfile>,
  ) {}

  async onApplicationBootstrap() {
    try {
      const testEmails = [
        'aluno@conexaofitness.com.br',
        'personal@conexaofitness.com.br',
        'nutri@conexaofitness.com.br',
        'fisio@conexaofitness.com.br',
        'academia@conexaofitness.com.br',
      ];

      // 1. Identificar bots por email de teste
      const botUsers = await this.usersRepo
        .createQueryBuilder('u')
        .where('u.email IN (:...emails)', { emails: testEmails })
        .getMany();

      // 2. Identificar provedores de serviços gerados por bots faker
      const rawFakerProviders = await this.usersRepo.query(
        `SELECT DISTINCT "providerId" FROM services WHERE "name" ILIKE 'Atendimento de %' OR "name" = 'Day Pass (Passe Diário) - Musculação & Cardio' OR "name" = 'Treino Personalizado Individual (60 min)' OR "name" = 'Consulta Nutricional Esportiva + Bioimpedância' OR "name" = 'Sessão de Fisioterapia & Liberação Miofascial'`
      ).catch(() => []);

      const fakerProviderIds = (rawFakerProviders || []).map((r: any) => r.providerId).filter(Boolean);
      const allBotIds = Array.from(new Set([...botUsers.map((b) => b.id), ...fakerProviderIds]));

      if (allBotIds.length > 0) {
        console.log(`🧹 [Auto-Purge] Removendo ${allBotIds.length} contas bots e serviços fictícios do banco...`);

        // Deletar agendamentos e slots
        await this.usersRepo.query(
          `DELETE FROM schedule_slots WHERE "serviceId" IN (SELECT id FROM services WHERE "providerId" = ANY($1))`,
          [allBotIds]
        ).catch(() => {});

        // Deletar serviços
        await this.usersRepo.query(
          `DELETE FROM services WHERE "providerId" = ANY($1)`,
          [allBotIds]
        ).catch(() => {});

        // Deletar interações de posts
        await this.usersRepo.query(
          `DELETE FROM post_likes WHERE "userId" = ANY($1)`,
          [allBotIds]
        ).catch(() => {});

        await this.usersRepo.query(
          `DELETE FROM post_comments WHERE "authorId" = ANY($1)`,
          [allBotIds]
        ).catch(() => {});

        await this.usersRepo.query(
          `DELETE FROM user_follows WHERE "followerId" = ANY($1) OR "followingId" = ANY($1)`,
          [allBotIds]
        ).catch(() => {});

        await this.usersRepo.query(
          `DELETE FROM posts WHERE "authorId" = ANY($1)`,
          [allBotIds]
        ).catch(() => {});

        // Deletar perfis
        await this.usersRepo.query(
          `DELETE FROM personal_profiles WHERE "userId" = ANY($1)`,
          [allBotIds]
        ).catch(() => {});

        await this.usersRepo.query(
          `DELETE FROM academia_profiles WHERE "userId" = ANY($1)`,
          [allBotIds]
        ).catch(() => {});

        await this.usersRepo.query(
          `DELETE FROM aluno_profiles WHERE "userId" = ANY($1)`,
          [allBotIds]
        ).catch(() => {});

        // Deletar usuários bots (preservando o admin)
        await this.usersRepo.query(
          `DELETE FROM users WHERE "id" = ANY($1) AND "email" != 'admin@conexaofitness.com.br'`,
          [allBotIds]
        ).catch(() => {});

        console.log('✅ [Auto-Purge] Banco limpo com sucesso! Apenas usuários reais e catálogo oficial permanecem.');
      }
    } catch (err) {
      console.error('Erro na inicialização da purga de bots:', err);
    }
  }

  async create(dto: CreateUserDto): Promise<User> {
    const cleanDoc = (dto.cpf || dto.cnpj || '').replace(/\D/g, '');
    if (!cleanDoc && dto.role !== 'ADMIN') {
      throw new BadRequestException('CPF ou CNPJ é obrigatório para cadastro.');
    }
    if (!dto.avatarUrl && dto.role !== 'ADMIN') {
      throw new BadRequestException('Foto de perfil é obrigatória para cadastro.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const user = this.usersRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash: hashedPassword,
      role: dto.role,
      status: (dto.role === 'STUDENT' || dto.role === 'ADMIN') ? 'ATIVO' : 'PENDENTE_KYC',
      cpf: dto.cpf || dto.cnpj,
      phone: dto.phone,
      avatarUrl: dto.avatarUrl,
    });

    const savedUser = await this.usersRepo.save(user);

    if (dto.role === 'PERSONAL' && dto.professionTitle) {
      const profile = this.personalProfileRepo.create({
        userId: savedUser.id,
        publicName: dto.name,
        professionTitle: dto.professionTitle,
        cref: dto.professionalRegistrationId,
        documentUrl: dto.professionalDocumentUrl,
      });
      await this.personalProfileRepo.save(profile);
    } else if (dto.role === 'ACADEMIA') {
      const profile = this.academiaProfileRepo.create({
        userId: savedUser.id,
        razaoSocial: dto.razaoSocial || dto.name,
        nomeFantasia: dto.nomeFantasia || dto.name,
        cnpj: dto.cnpj || dto.cpf || '',
        documentUrl: dto.professionalDocumentUrl,
      });
      await this.academiaProfileRepo.save(profile);
    }

    return savedUser;
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<any> {
    const user = await this.findOneOrFail(userId);
    user.avatarUrl = avatarUrl;
    await this.usersRepo.save(user);

    const reloaded = await this.findOneOrFail(userId);
    return {
      id: reloaded.id,
      name: reloaded.name,
      email: reloaded.email,
      role: reloaded.role,
      status: reloaded.status,
      avatarUrl: reloaded.avatarUrl,
      professionTitle: reloaded.personalProfile?.professionTitle,
      documentUrl: reloaded.personalProfile?.documentUrl || reloaded.academiaProfile?.documentUrl,
      cref: reloaded.personalProfile?.cref,
      bio: reloaded.personalProfile?.bio || reloaded.bio,
      kycRejectionReason: reloaded.kycRejectionReason,
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findOne(id: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { id },
      relations: ['alunoProfile', 'personalProfile', 'academiaProfile'],
    });
  }

  async findOneOrFail(id: string): Promise<User> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.usersRepo.update(id, dto);
    return this.findOneOrFail(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async createPersonalProfile(userId: string, dto: CreatePersonalProfileDto): Promise<User> {
    const user = await this.findOneOrFail(userId);
    if (user.role !== 'PERSONAL') {
      throw new Error('Usuário não é um PERSONAL');
    }
    
    const profile = user.personalProfile ?? this.personalProfileRepo.create({ userId: user.id });
    
    profile.publicName = dto.publicName;
    profile.cref = dto.cref;
    profile.bio = dto.bio;
    profile.modalities = dto.modalities;
    profile.serviceRadiusKm = dto.serviceRadiusKm ?? 5;
    profile.baseHourlyPrice = dto.baseHourlyPrice;
    profile.documentUrl = dto.documentUrl;
    
    await this.personalProfileRepo.save(profile);
    return this.findOneOrFail(userId);
  }

  async createAcademiaProfile(userId: string, dto: CreateAcademiaProfileDto): Promise<User> {
    const user = await this.findOneOrFail(userId);
    if (user.role !== 'ACADEMIA') {
      throw new Error('Usuário não é uma ACADEMIA');
    }
    
    const profile = user.academiaProfile ?? this.academiaProfileRepo.create({ userId: user.id });
    
    profile.razaoSocial = dto.razaoSocial;
    profile.nomeFantasia = dto.nomeFantasia;
    profile.cnpj = dto.cnpj;
    profile.documentUrl = dto.documentUrl;
    
    await this.academiaProfileRepo.save(profile);
    return this.findOneOrFail(userId);
  }

  async updateDocument(userId: string, documentUrl: string): Promise<User> {
    const user = await this.findOneOrFail(userId);

    if (user.role === 'PERSONAL') {
      const profile = user.personalProfile ?? this.personalProfileRepo.create({ userId: user.id, publicName: user.name });
      profile.documentUrl = documentUrl;
      await this.personalProfileRepo.save(profile);
    } else if (user.role === 'ACADEMIA') {
      const profile = user.academiaProfile ?? this.academiaProfileRepo.create({ userId: user.id, razaoSocial: user.name, nomeFantasia: user.name, cnpj: user.cpf || '' });
      profile.documentUrl = documentUrl;
      await this.academiaProfileRepo.save(profile);
    }

    // Se estava rejeitado ou suspenso por KYC, volta para PENDENTE_KYC para reanálise da Finex
    user.status = 'PENDENTE_KYC';
    user.kycRejectionReason = null as any;
    return this.usersRepo.save(user);
  }

  async updateBio(userId: string, rawBio: string): Promise<User> {
    const user = await this.findOneOrFail(userId);
    const trimmedBio = (rawBio || '').trim();

    if (trimmedBio) {
      const validation = validateBioContent(trimmedBio);
      if (!validation.isValid) {
        throw new BadRequestException(validation.errorMessage);
      }
    }

    user.bio = trimmedBio;
    await this.usersRepo.save(user);

    if (user.role === 'PERSONAL') {
      const profile = user.personalProfile ?? this.personalProfileRepo.create({
        userId: user.id,
        publicName: user.name,
        professionTitle: 'Personal Trainer',
      });
      profile.bio = trimmedBio;
      await this.personalProfileRepo.save(profile);
    }

    return this.findOneOrFail(userId);
  }

  async getPersonalProfile(userId: string) {
    const user = await this.findOneOrFail(userId);
    let profile = user.personalProfile;
    if (!profile) {
      const newProfile = this.personalProfileRepo.create({
        userId: user.id,
        publicName: user.name,
        professionTitle: 'Personal Trainer',
      });
      profile = await this.personalProfileRepo.save(newProfile);
    }
    const safeProfile = profile!;

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      publicName: safeProfile.publicName || user.name,
      cref: safeProfile.cref,
      professionTitle: safeProfile.professionTitle || 'Personal Trainer',
      bio: safeProfile.bio || user.bio || '',
      methodology: safeProfile.methodology || '',
      specialties: safeProfile.specialties || [],
      serviceLocations: safeProfile.serviceLocations || [],
      includedBenefits: safeProfile.includedBenefits || [],
      modalities: safeProfile.modalities || [],
      galleryUrls: safeProfile.galleryUrls || [],
      instagram: safeProfile.instagram || '',
      whatsapp: safeProfile.whatsapp || user.phone || '',
      cityBase: user.cityBase || 'Uruguaiana - RS',
      serviceRadiusKm: safeProfile.serviceRadiusKm ?? 5,
      baseHourlyPrice: safeProfile.baseHourlyPrice,
      qualityScore: safeProfile.qualityScore ?? 5.0,
      responseRate: safeProfile.responseRate ?? 100,
    };
  }

  async updatePersonalProfile(userId: string, dto: UpdatePersonalProfileDto): Promise<any> {
    const user = await this.findOneOrFail(userId);
    if (user.role !== 'PERSONAL') {
      throw new BadRequestException('Apenas profissionais (Personal) podem atualizar este perfil.');
    }

    const profile = user.personalProfile ?? this.personalProfileRepo.create({
      userId: user.id,
      publicName: user.name,
      professionTitle: 'Personal Trainer',
    });

    if (dto.publicName !== undefined) {
      profile.publicName = dto.publicName;
      user.name = dto.publicName;
    }
    if (dto.professionTitle !== undefined) profile.professionTitle = dto.professionTitle;
    if (dto.cref !== undefined) profile.cref = dto.cref;
    if (dto.bio !== undefined) {
      profile.bio = dto.bio;
      user.bio = dto.bio;
    }
    if (dto.methodology !== undefined) profile.methodology = dto.methodology;
    if (dto.specialties !== undefined) profile.specialties = dto.specialties;
    if (dto.serviceLocations !== undefined) profile.serviceLocations = dto.serviceLocations;
    if (dto.includedBenefits !== undefined) profile.includedBenefits = dto.includedBenefits;
    if (dto.modalities !== undefined) profile.modalities = dto.modalities;
    if (dto.galleryUrls !== undefined) profile.galleryUrls = dto.galleryUrls;
    if (dto.instagram !== undefined) profile.instagram = dto.instagram;
    if (dto.whatsapp !== undefined) {
      profile.whatsapp = dto.whatsapp;
      user.phone = dto.whatsapp;
    }
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;
    if (dto.cityBase !== undefined) user.cityBase = dto.cityBase;
    if (dto.serviceRadiusKm !== undefined) profile.serviceRadiusKm = dto.serviceRadiusKm;
    if (dto.baseHourlyPrice !== undefined) profile.baseHourlyPrice = dto.baseHourlyPrice;

    await this.usersRepo.save(user);
    await this.personalProfileRepo.save(profile);

    return this.getPersonalProfile(userId);
  }

  async getAcademiaProfile(userId: string) {
    const user = await this.findOneOrFail(userId);
    let profile = user.academiaProfile;
    if (!profile) {
      const newProfile = this.academiaProfileRepo.create({
        userId: user.id,
        razaoSocial: user.name,
        nomeFantasia: user.name,
        cnpj: user.cpf || '',
      });
      profile = await this.academiaProfileRepo.save(newProfile);
    }
    const safeProfile = profile!;

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      coverUrl: safeProfile.coverUrl,
      razaoSocial: safeProfile.razaoSocial,
      nomeFantasia: safeProfile.nomeFantasia,
      cnpj: safeProfile.cnpj,
      bio: safeProfile.bio || user.bio || '',
      address: safeProfile.address,
      city: safeProfile.city || user.cityBase,
      state: safeProfile.state,
      zipCode: safeProfile.zipCode,
      phone: safeProfile.phone || user.phone,
      whatsapp: safeProfile.whatsapp,
      instagram: safeProfile.instagram,
      website: safeProfile.website,
      openingHours: safeProfile.openingHours,
      facilities: safeProfile.facilities || [],
      modalities: safeProfile.modalities || [],
      galleryUrls: safeProfile.galleryUrls || [],
      dayPassPrice: safeProfile.dayPassPrice ? Number(safeProfile.dayPassPrice) : undefined,
    };
  }

  async updateAcademiaProfile(userId: string, dto: any): Promise<any> {
    const user = await this.findOneOrFail(userId);
    if (user.role !== 'ACADEMIA') {
      throw new BadRequestException('Apenas contas de Academia podem atualizar este perfil.');
    }

    const profile = user.academiaProfile ?? this.academiaProfileRepo.create({
      userId: user.id,
      razaoSocial: dto.razaoSocial || user.name,
      nomeFantasia: dto.nomeFantasia || user.name,
      cnpj: dto.cnpj || user.cpf || '',
    });

    if (dto.nomeFantasia !== undefined) profile.nomeFantasia = dto.nomeFantasia;
    if (dto.razaoSocial !== undefined) profile.razaoSocial = dto.razaoSocial;
    if (dto.cnpj !== undefined) profile.cnpj = dto.cnpj;
    if (dto.bio !== undefined) {
      profile.bio = dto.bio;
      user.bio = dto.bio;
    }
    if (dto.coverUrl !== undefined) profile.coverUrl = dto.coverUrl;
    if (dto.avatarUrl !== undefined) {
      user.avatarUrl = dto.avatarUrl;
    }
    if (dto.address !== undefined) profile.address = dto.address;
    if (dto.city !== undefined) {
      profile.city = dto.city;
      user.cityBase = dto.city;
    }
    if (dto.state !== undefined) profile.state = dto.state;
    if (dto.zipCode !== undefined) profile.zipCode = dto.zipCode;
    if (dto.phone !== undefined) {
      profile.phone = dto.phone;
      user.phone = dto.phone;
    }
    if (dto.whatsapp !== undefined) profile.whatsapp = dto.whatsapp;
    if (dto.instagram !== undefined) profile.instagram = dto.instagram;
    if (dto.website !== undefined) profile.website = dto.website;
    if (dto.openingHours !== undefined) profile.openingHours = dto.openingHours;
    if (dto.facilities !== undefined) profile.facilities = dto.facilities;
    if (dto.modalities !== undefined) profile.modalities = dto.modalities;
    if (dto.galleryUrls !== undefined) profile.galleryUrls = dto.galleryUrls;
    if (dto.dayPassPrice !== undefined) profile.dayPassPrice = dto.dayPassPrice;

    await this.usersRepo.save(user);
    await this.academiaProfileRepo.save(profile);

    return this.getAcademiaProfile(userId);
  }

  async getPublicProfile(id: string) {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('Perfil de profissional ou usuário não encontrado.');
    }

    const isAcademia = user.role === 'ACADEMIA';
    const isPersonal = user.role === 'PERSONAL';
    const acadProfile = user.academiaProfile;
    const personalProfile = user.personalProfile;

    return {
      id: user.id,
      name: isAcademia ? acadProfile?.nomeFantasia || user.name : user.name,
      razaoSocial: acadProfile?.razaoSocial,
      nomeFantasia: acadProfile?.nomeFantasia,
      cnpj: acadProfile?.cnpj,
      avatarUrl: user.avatarUrl,
      coverUrl: acadProfile?.coverUrl,
      role: user.role,
      status: user.status,
      cityBase: isAcademia ? (acadProfile?.city || user.cityBase || 'Uruguaiana - RS') : (user.cityBase || 'Uruguaiana - RS'),
      address: acadProfile?.address,
      state: acadProfile?.state,
      zipCode: acadProfile?.zipCode,
      phone: isAcademia ? (acadProfile?.phone || user.phone) : (personalProfile?.whatsapp || user.phone),
      whatsapp: isAcademia ? (acadProfile?.whatsapp || user.phone) : (personalProfile?.whatsapp || user.phone),
      instagram: isAcademia ? acadProfile?.instagram : personalProfile?.instagram,
      website: acadProfile?.website,
      openingHours: acadProfile?.openingHours,
      facilities: acadProfile?.facilities || [],
      modalities: isAcademia ? acadProfile?.modalities || [] : personalProfile?.modalities || [],
      specialties: isPersonal ? personalProfile?.specialties || [] : [],
      serviceLocations: isPersonal ? personalProfile?.serviceLocations || [] : [],
      includedBenefits: isPersonal ? personalProfile?.includedBenefits || [] : [],
      methodology: isPersonal ? personalProfile?.methodology : undefined,
      galleryUrls: isAcademia ? (acadProfile?.galleryUrls || []) : (personalProfile?.galleryUrls || []),
      dayPassPrice: acadProfile?.dayPassPrice ? Number(acadProfile.dayPassPrice) : undefined,
      averageRating: user.averageRating || 5.0,
      totalReviews: user.totalReviews || 0,
      professionTitle: isAcademia ? 'Academia' : personalProfile?.professionTitle || (isPersonal ? 'Personal Trainer' : undefined),
      cref: personalProfile?.cref,
      bio: isAcademia ? acadProfile?.bio || user.bio || '' : personalProfile?.bio || user.bio || '',
      baseHourlyPrice: personalProfile?.baseHourlyPrice,
      qualityScore: isAcademia ? (acadProfile?.qualityScore ?? 5.0) : (personalProfile?.qualityScore ?? 5.0),
      responseRate: isAcademia ? (acadProfile?.responseRate ?? 100) : (personalProfile?.responseRate ?? 100),
      createdAt: user.createdAt,
    };
  }
}

