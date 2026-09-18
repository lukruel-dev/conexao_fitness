import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    validateUser: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register', async () => {
      const dto = { email: 'test@test.com', name: 'Test', password: '123' } as any;
      mockAuthService.register.mockResolvedValue({ accessToken: 'token' });

      const result = await controller.register(dto);
      expect(result).toEqual({ accessToken: 'token' });
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if validation fails', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);
      await expect(controller.login({ email: 'test', password: '123' })).rejects.toThrow(UnauthorizedException);
    });

    it('should call authService.login if validation succeeds', async () => {
      const user = { id: 'u1' };
      mockAuthService.validateUser.mockResolvedValue(user);
      mockAuthService.login.mockResolvedValue({ accessToken: 'token' });

      const result = await controller.login({ email: 'test', password: '123' });
      expect(result).toEqual({ accessToken: 'token' });
      expect(mockAuthService.login).toHaveBeenCalledWith(user);
    });
  });

  describe('getProfile', () => {
    it('should return user from request', async () => {
      const req = { user: { id: 'u1' } };
      mockAuthService.getUserProfile = jest.fn().mockResolvedValue({ id: 'u1' });
      const result = await controller.getProfile(req);
      expect(result).toEqual({ user: { id: 'u1' } });
    });
  });

  describe('verifyEmail', () => {
    it('should call authService.verifyEmail', async () => {
      mockAuthService.verifyEmail = jest.fn().mockResolvedValue({ accessToken: 'token' });
      const result = await controller.verifyEmail({ email: 'test@test.com', code: '123456' });
      expect(result).toEqual({ accessToken: 'token' });
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith({ email: 'test@test.com', code: '123456' });
    });
  });

  describe('resendVerificationCode', () => {
    it('should call authService.resendVerificationCode', async () => {
      mockAuthService.resendVerificationCode = jest.fn().mockResolvedValue({ success: true });
      const result = await controller.resendVerificationCode({ email: 'test@test.com' });
      expect(result).toEqual({ success: true });
      expect(mockAuthService.resendVerificationCode).toHaveBeenCalledWith({ email: 'test@test.com' });
    });
  });

  describe('forgotPassword', () => {
    it('should call authService.forgotPassword', async () => {
      mockAuthService.forgotPassword = jest.fn().mockResolvedValue({ success: true });
      const result = await controller.forgotPassword({ email: 'test@test.com' });
      expect(result).toEqual({ success: true });
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith({ email: 'test@test.com' });
    });
  });

  describe('resetPassword', () => {
    it('should call authService.resetPassword', async () => {
      mockAuthService.resetPassword = jest.fn().mockResolvedValue({ success: true });
      const result = await controller.resetPassword({ email: 'test@test.com', code: '123456', newPassword: 'pass' });
      expect(result).toEqual({ success: true });
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith({ email: 'test@test.com', code: '123456', newPassword: 'pass' });
    });
  });
});
