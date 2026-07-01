import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findOneOrFail: jest.fn(),
    update: jest.fn(),
    createPersonalProfile: jest.fn(),
    createAcademiaProfile: jest.fn(),
    updateAvatar: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call usersService.create', async () => {
      const dto = { name: 'Test' } as any;
      mockUsersService.create.mockResolvedValue({ id: 'u1' });
      const result = await controller.create(dto);
      expect(result).toEqual({ id: 'u1' });
      expect(mockUsersService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findOne', () => {
    it('should call usersService.findOneOrFail', async () => {
      mockUsersService.findOneOrFail.mockResolvedValue({ id: 'u1' });
      const result = await controller.findOne('u1');
      expect(result).toEqual({ id: 'u1' });
      expect(mockUsersService.findOneOrFail).toHaveBeenCalledWith('u1');
    });
  });

  describe('update', () => {
    it('should call usersService.update', async () => {
      mockUsersService.update.mockResolvedValue({ id: 'u1' });
      const result = await controller.update('u1', { name: 'New' });
      expect(result).toEqual({ id: 'u1' });
      expect(mockUsersService.update).toHaveBeenCalledWith('u1', { name: 'New' });
    });
  });

  describe('createPersonalProfile', () => {
    it('should call usersService.createPersonalProfile', async () => {
      mockUsersService.createPersonalProfile.mockResolvedValue({ id: 'u1' });
      const result = await controller.createPersonalProfile({ id: 'u1' }, { publicName: 'Test' } as any);
      expect(result).toEqual({ id: 'u1' });
      expect(mockUsersService.createPersonalProfile).toHaveBeenCalledWith('u1', { publicName: 'Test' });
    });
  });

  describe('createAcademiaProfile', () => {
    it('should call usersService.createAcademiaProfile', async () => {
      mockUsersService.createAcademiaProfile.mockResolvedValue({ id: 'u1' });
      const result = await controller.createAcademiaProfile({ id: 'u1' }, { razaoSocial: 'Test' } as any);
      expect(result).toEqual({ id: 'u1' });
      expect(mockUsersService.createAcademiaProfile).toHaveBeenCalledWith('u1', { razaoSocial: 'Test' });
    });
  });

  describe('updateAvatar', () => {
    it('should call usersService.updateAvatar', async () => {
      mockUsersService.updateAvatar.mockResolvedValue({ id: 'u1' });
      const result = await controller.updateAvatar({ id: 'u1' }, 'http://avatar');
      expect(result).toEqual({ id: 'u1' });
      expect(mockUsersService.updateAvatar).toHaveBeenCalledWith('u1', 'http://avatar');
    });
  });
});
