import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;

  const mockService = {
    findAllForUser: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyNotifications', () => {
    it('should call findAllForUser', async () => {
      mockService.findAllForUser.mockResolvedValue([{ id: 'n1' }]);
      const result = await controller.getMyNotifications({ id: 'u1' });
      expect(result).toEqual([{ id: 'n1' }]);
      expect(mockService.findAllForUser).toHaveBeenCalledWith('u1');
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockService.getUnreadCount.mockResolvedValue(3);
      const result = await controller.getUnreadCount({ id: 'u1' });
      expect(result).toEqual({ unread: 3 });
      expect(mockService.getUnreadCount).toHaveBeenCalledWith('u1');
    });
  });

  describe('markAsRead', () => {
    it('should call markAsRead', async () => {
      mockService.markAsRead.mockResolvedValue({ id: 'n1', isRead: true });
      const result = await controller.markAsRead('n1', { id: 'u1' });
      expect(result).toEqual({ id: 'n1', isRead: true });
      expect(mockService.markAsRead).toHaveBeenCalledWith('n1', 'u1');
    });
  });
});
