import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mocked-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without passwordHash if credentials are valid', async () => {
      const user = { id: 'u1', email: 'test@test.com', passwordHash: 'hash', role: 'STUDENT' };
      mockUsersService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@test.com', 'password');
      expect(result).toEqual({ id: 'u1', email: 'test@test.com', role: 'STUDENT' });
    });

    it('should return null if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      
      const result = await service.validateUser('test@test.com', 'password');
      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      const user = { id: 'u1', email: 'test@test.com', passwordHash: 'hash', role: 'STUDENT' };
      mockUsersService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@test.com', 'wrongpassword');
      expect(result).toBeNull();
    });

    it('should throw UnauthorizedException if account is suspended', async () => {
      const user = { id: 'u1', email: 'test@test.com', passwordHash: 'hash', status: 'SUSPENSO' };
      mockUsersService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.validateUser('test@test.com', 'password')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return access token and user info', async () => {
      const user = { id: 'u1', name: 'Test', email: 'test@test.com', role: 'STUDENT', avatarUrl: null };
      
      const result = await service.login(user);
      expect(result).toEqual({
        accessToken: 'mocked-token',
        user: { id: 'u1', name: 'Test', email: 'test@test.com', role: 'STUDENT', avatarUrl: null },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({ email: 'test@test.com', sub: 'u1', role: 'STUDENT' });
    });
  });

  describe('register', () => {
    it('should throw ConflictException if email exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: 'u1' });
      await expect(service.register({ email: 'test@test.com' } as any)).rejects.toThrow(ConflictException);
    });

    it('should create user and log in if email is unique', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const newUser = { id: 'u1', name: 'Test', email: 'test@test.com', role: 'STUDENT' };
      mockUsersService.create.mockResolvedValue(newUser);

      const result = await service.register({ email: 'test@test.com', name: 'Test', password: '123' } as any);
      expect(result).toHaveProperty('accessToken', 'mocked-token');
      expect(result.user.id).toBe('u1');
    });
  });
});
