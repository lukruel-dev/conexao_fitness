import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { PersonalProfile } from './entities/personal-profile.entity';
import { AcademiaProfile } from './entities/academia-profile.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreatePersonalProfileDto } from './dto/create-personal-profile.dto';
import { CreateAcademiaProfileDto } from './dto/create-academia-profile.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(PersonalProfile)
    private readonly personalProfileRepo: Repository<PersonalProfile>,
    @InjectRepository(AcademiaProfile)
    private readonly academiaProfileRepo: Repository<AcademiaProfile>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const user = this.usersRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash: hashedPassword,
      role: dto.role,
      status: 'PENDENTE_KYC',
    });

    return this.usersRepo.save(user);
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<User> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.avatarUrl = avatarUrl;
    return this.usersRepo.save(user);
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
    
    let profile = user.personalProfile;
    if (!profile) {
      profile = this.personalProfileRepo.create({ userId: user.id });
    }
    
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
    
    let profile = user.academiaProfile;
    if (!profile) {
      profile = this.academiaProfileRepo.create({ userId: user.id });
    }
    
    profile.razaoSocial = dto.razaoSocial;
    profile.nomeFantasia = dto.nomeFantasia;
    profile.cnpj = dto.cnpj;
    profile.documentUrl = dto.documentUrl;
    
    await this.academiaProfileRepo.save(profile);
    return this.findOneOrFail(userId);
  }
}
