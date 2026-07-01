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
    it('should return user from request', () => {
      const req = { user: { id: 'u1' } };
      expect(controller.getProfile(req)).toEqual({ user: { id: 'u1' } });
    });
  });
});
