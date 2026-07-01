import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotFoundException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockRepo = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockImplementation(n => ({ id: 'n1', ...n })),
    find: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save notification', async () => {
      const result = await service.create('u1', 'Title', 'Msg', NotificationType.SYSTEM);
      expect(result).toHaveProperty('id', 'n1');
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  describe('findAllForUser', () => {
    it('should find all notifications for user', async () => {
      mockRepo.find.mockResolvedValue([{ id: 'n1' }]);
      const result = await service.findAllForUser('u1');
      expect(result).toEqual([{ id: 'n1' }]);
    });
  });

  describe('getUnreadCount', () => {
    it('should count unread notifications', async () => {
      mockRepo.count.mockResolvedValue(5);
      const result = await service.getUnreadCount('u1');
      expect(result).toBe(5);
      expect(mockRepo.count).toHaveBeenCalledWith({ where: { userId: 'u1', isRead: false } });
    });
  });

  describe('markAsRead', () => {
    it('should throw NotFoundException if notification not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.markAsRead('n1', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('should mark as read', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'n1', isRead: false });
      const result = await service.markAsRead('n1', 'u1');
      expect(result.isRead).toBe(true);
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });
});
