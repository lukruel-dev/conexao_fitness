import { Test, TestingModule } from '@nestjs/testing';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

describe('ServicesController', () => {
  let controller: ServicesController;
  let service: ServicesService;

  const mockServicesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOneOrFail: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    generateSlotsForService: jest.fn(),
    createScheduleSlotForService: jest.fn(),
    listScheduleSlotsForService: jest.fn(),
    updateScheduleSlot: jest.fn(),
    deleteScheduleSlot: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        {
          provide: ServicesService,
          useValue: mockServicesService,
        },
      ],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
    service = module.get<ServicesService>(ServicesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', async () => {
      mockServicesService.create.mockResolvedValue({ id: 's1' });
      const result = await controller.create({ name: 'Test' } as any);
      expect(result).toEqual({ id: 's1' });
      expect(mockServicesService.create).toHaveBeenCalledWith({ name: 'Test' });
    });
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      mockServicesService.findAll.mockResolvedValue([{ id: 's1' }]);
      const result = await controller.findAll({});
      expect(result).toEqual([{ id: 's1' }]);
      expect(mockServicesService.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('findOne', () => {
    it('should call service.findOneOrFail', async () => {
      mockServicesService.findOneOrFail.mockResolvedValue({ id: 's1' });
      const result = await controller.findOne('s1');
      expect(result).toEqual({ id: 's1' });
      expect(mockServicesService.findOneOrFail).toHaveBeenCalledWith('s1');
    });
  });

  describe('update', () => {
    it('should call service.update', async () => {
      mockServicesService.update.mockResolvedValue({ id: 's1' });
      const result = await controller.update('s1', { name: 'Update' } as any);
      expect(result).toEqual({ id: 's1' });
      expect(mockServicesService.update).toHaveBeenCalledWith('s1', { name: 'Update' });
    });
  });

  describe('remove', () => {
    it('should call service.remove', async () => {
      mockServicesService.remove.mockResolvedValue(undefined);
      await controller.remove('s1');
      expect(mockServicesService.remove).toHaveBeenCalledWith('s1');
    });
  });

  describe('generateSlots', () => {
    it('should call service.generateSlotsForService', async () => {
      mockServicesService.generateSlotsForService.mockResolvedValue({ createdCount: 5 });
      const result = await controller.generateSlots('s1', 30);
      expect(result).toEqual({ createdCount: 5 });
      expect(mockServicesService.generateSlotsForService).toHaveBeenCalledWith('s1', 30);
    });
  });

  describe('createScheduleSlotForService', () => {
    it('should call service.createScheduleSlotForService', async () => {
      mockServicesService.createScheduleSlotForService.mockResolvedValue({ id: 'slot1' });
      const result = await controller.createScheduleSlotForService('s1', {} as any);
      expect(result).toEqual({ id: 'slot1' });
    });
  });

  describe('listScheduleSlotsForService', () => {
    it('should call service.listScheduleSlotsForService', async () => {
      mockServicesService.listScheduleSlotsForService.mockResolvedValue([{ id: 'slot1' }]);
      const result = await controller.listScheduleSlotsForService('s1', {});
      expect(result).toEqual([{ id: 'slot1' }]);
    });
  });

  describe('updateScheduleSlot', () => {
    it('should call service.updateScheduleSlot', async () => {
      mockServicesService.updateScheduleSlot.mockResolvedValue({ id: 'slot1' });
      const result = await controller.updateScheduleSlot('slot1', {} as any);
      expect(result).toEqual({ id: 'slot1' });
    });
  });

  describe('deleteScheduleSlot', () => {
    it('should call service.deleteScheduleSlot', async () => {
      mockServicesService.deleteScheduleSlot.mockResolvedValue(undefined);
      await controller.deleteScheduleSlot('slot1');
      expect(mockServicesService.deleteScheduleSlot).toHaveBeenCalledWith('slot1');
    });
  });
});
