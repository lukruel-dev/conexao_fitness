import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Subscription } from '../payments/entities/subscription.entity';
import { EmailService } from '../notifications/email.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByCpf: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mocked-token'),
  };

  const mockEmailService = {
    sendEmail: jest.fn().mockResolvedValue(undefined),
    sendVerificationCode: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockSubscriptionRepo = {
    findOne: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: getRepositoryToken(Subscription), useValue: mockSubscriptionRepo },
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
      const user = { id: 'u1', email: 'test@test.com', passwordHash: 'hash', role: 'STUDENT', isEmailVerified: true };
      mockUsersService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@test.com', 'password');
      expect(result).toEqual({ id: 'u1', email: 'test@test.com', role: 'STUDENT', isEmailVerified: true });
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

    it('should throw UnauthorizedException with EMAIL_NOT_VERIFIED if user has unverified code', async () => {
      const user = {
        id: 'u1',
        name: 'Test',
        email: 'test@test.com',
        passwordHash: 'hash',
        isEmailVerified: false,
        emailVerificationCode: '123456',
        emailVerificationExpiresAt: new Date(Date.now() + 600000),
      };
      mockUsersService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.validateUser('test@test.com', 'password')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return access token and user info', async () => {
      const user = { id: 'u1', name: 'Test', email: 'test@test.com', role: 'STUDENT', avatarUrl: null, isEmailVerified: true };
      
      const result = await service.login(user);
      expect(result).toEqual({
        accessToken: 'mocked-token',
        user: expect.objectContaining({
          id: 'u1',
          name: 'Test',
          email: 'test@test.com',
          role: 'STUDENT',
          isEmailVerified: true,
        }),
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({ email: 'test@test.com', sub: 'u1', role: 'STUDENT' });
    });
  });

  describe('register', () => {
    it('should throw ConflictException if email exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: 'u1' });
      await expect(service.register({ email: 'test@test.com' } as any)).rejects.toThrow(ConflictException);
    });

    it('should create user, generate OTP code and send verification email', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const newUser = { id: 'u1', name: 'Test', email: 'test@test.com', role: 'STUDENT' };
      mockUsersService.create.mockResolvedValue(newUser);
      mockUsersService.save.mockResolvedValue(newUser);

      const result = await service.register({ email: 'test@test.com', name: 'Test', password: '123' } as any);
      expect(result).toHaveProperty('requiresEmailVerification', true);
      expect(result).toHaveProperty('email', 'test@test.com');
      expect(mockEmailService.sendVerificationCode).toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and return login session when OTP is correct', async () => {
      const user = {
        id: 'u1',
        name: 'Test',
        email: 'test@test.com',
        role: 'STUDENT',
        isEmailVerified: false,
        emailVerificationCode: '654321',
        emailVerificationExpiresAt: new Date(Date.now() + 600000),
      };
      mockUsersService.findByEmail.mockResolvedValue(user);
      mockUsersService.save.mockImplementation((u) => Promise.resolve(u));

      const result = await service.verifyEmail({ email: 'test@test.com', code: '654321' });
      expect(user.isEmailVerified).toBe(true);
      expect(result).toHaveProperty('accessToken', 'mocked-token');
    });

    it('should throw BadRequestException if code is incorrect', async () => {
      const user = {
        id: 'u1',
        email: 'test@test.com',
        isEmailVerified: false,
        emailVerificationCode: '654321',
        emailVerificationExpiresAt: new Date(Date.now() + 600000),
      };
      mockUsersService.findByEmail.mockResolvedValue(user);

      await expect(service.verifyEmail({ email: 'test@test.com', code: '000000' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if code is expired', async () => {
      const user = {
        id: 'u1',
        email: 'test@test.com',
        isEmailVerified: false,
        emailVerificationCode: '654321',
        emailVerificationExpiresAt: new Date(Date.now() - 10000),
      };
      mockUsersService.findByEmail.mockResolvedValue(user);

      await expect(service.verifyEmail({ email: 'test@test.com', code: '654321' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('forgotPassword & resetPassword', () => {
    it('should send reset code when email exists', async () => {
      const user = { id: 'u1', name: 'Test', email: 'test@test.com' };
      mockUsersService.findByEmail.mockResolvedValue(user);
      mockUsersService.save.mockResolvedValue(user);

      const result = await service.forgotPassword({ email: 'test@test.com' });
      expect(result.success).toBe(true);
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should reset password with valid code', async () => {
      const user = {
        id: 'u1',
        email: 'test@test.com',
        passwordResetToken: '987654',
        passwordResetExpiresAt: new Date(Date.now() + 600000),
      };
      mockUsersService.findByEmail.mockResolvedValue(user);
      mockUsersService.save.mockResolvedValue(user);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      const result = await service.resetPassword({ email: 'test@test.com', code: '987654', newPassword: 'newPassword123' });
      expect(result.success).toBe(true);
      expect(user.passwordResetToken).toBeNull();
    });
  });
});
