import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { PersonalProfile } from './entities/personal-profile.entity';
import { AcademiaProfile } from './entities/academia-profile.entity';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('UsersService', () => {
  let service: UsersService;

  const mockUsersRepo = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockImplementation(user => Promise.resolve({ id: 'u1', ...user })),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockPersonalProfileRepo = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
  };

  const mockAcademiaProfileRepo = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUsersRepo },
        { provide: getRepositoryToken(PersonalProfile), useValue: mockPersonalProfileRepo },
        { provide: getRepositoryToken(AcademiaProfile), useValue: mockAcademiaProfileRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should hash password and create user', async () => {
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const dto = { name: 'Test', email: 'test@test.com', password: '123', role: 'STUDENT' };
      const result = await service.create(dto as any);
      
      expect(bcrypt.hash).toHaveBeenCalledWith('123', 'salt');
      expect(mockUsersRepo.create).toHaveBeenCalledWith({
        name: 'Test',
        email: 'test@test.com',
        passwordHash: 'hashed_password',
        role: 'STUDENT',
        status: 'PENDENTE_KYC',
      });
      expect(result).toHaveProperty('id', 'u1');
    });
  });

  describe('updateAvatar', () => {
    it('should update and save user avatar', async () => {
      mockUsersRepo.findOne.mockResolvedValue({ id: 'u1' });
      await service.updateAvatar('u1', 'http://avatar.com');
      expect(mockUsersRepo.save).toHaveBeenCalledWith({ id: 'u1', avatarUrl: 'http://avatar.com' });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);
      await expect(service.updateAvatar('u1', 'url')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneOrFail', () => {
    it('should return user', async () => {
      mockUsersRepo.findOne.mockResolvedValue({ id: 'u1' });
      const result = await service.findOneOrFail('u1');
      expect(result.id).toBe('u1');
    });

    it('should throw NotFoundException', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);
      await expect(service.findOneOrFail('u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update user and return it', async () => {
      mockUsersRepo.update.mockResolvedValue({ affected: 1 });
      mockUsersRepo.findOne.mockResolvedValue({ id: 'u1', name: 'Updated' });

      const result = await service.update('u1', { name: 'Updated' });
      expect(mockUsersRepo.update).toHaveBeenCalledWith('u1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should remove user', async () => {
      mockUsersRepo.delete.mockResolvedValue({ affected: 1 });
      await service.remove('u1');
      expect(mockUsersRepo.delete).toHaveBeenCalledWith('u1');
    });

    it('should throw NotFoundException if affected 0', async () => {
      mockUsersRepo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.remove('u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPersonalProfile', () => {
    it('should throw Error if user is not PERSONAL', async () => {
      mockUsersRepo.findOne.mockResolvedValue({ id: 'u1', role: 'STUDENT' });
      await expect(service.createPersonalProfile('u1', {} as any)).rejects.toThrow('Usuário não é um PERSONAL');
    });

    it('should create new profile if none exists', async () => {
      mockUsersRepo.findOne.mockResolvedValue({ id: 'u1', role: 'PERSONAL' });
      const dto = { publicName: 'Test', baseHourlyPrice: 100 } as any;

      await service.createPersonalProfile('u1', dto);
      expect(mockPersonalProfileRepo.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1' }));
      expect(mockPersonalProfileRepo.save).toHaveBeenCalledWith(expect.objectContaining({ publicName: 'Test' }));
    });
  });

  describe('createAcademiaProfile', () => {
    it('should throw Error if user is not ACADEMIA', async () => {
      mockUsersRepo.findOne.mockResolvedValue({ id: 'u1', role: 'STUDENT' });
      await expect(service.createAcademiaProfile('u1', {} as any)).rejects.toThrow('Usuário não é uma ACADEMIA');
    });

    it('should create new profile if none exists', async () => {
      mockUsersRepo.findOne.mockResolvedValue({ id: 'u1', role: 'ACADEMIA' });
      const dto = { razaoSocial: 'Test', cnpj: '123' } as any;

      await service.createAcademiaProfile('u1', dto);
      expect(mockAcademiaProfileRepo.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1' }));
      expect(mockAcademiaProfileRepo.save).toHaveBeenCalledWith(expect.objectContaining({ razaoSocial: 'Test' }));
    });
  });
});
