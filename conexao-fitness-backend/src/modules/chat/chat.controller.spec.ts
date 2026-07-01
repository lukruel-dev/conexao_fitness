import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';

describe('ChatController', () => {
  let controller: ChatController;
  let service: ChatService;

  const mockChatService = {
    sendMessage: jest.fn(),
    getMessages: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    service = module.get<ChatService>(ChatService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should call sendMessage on service', async () => {
      const dto: CreateMessageDto = { bookingId: 'b1', content: 'hello' };
      mockChatService.sendMessage.mockResolvedValue({ id: 'msg-1' });

      const result = await controller.sendMessage(dto, { id: 'u1' });
      expect(result).toEqual({ id: 'msg-1' });
      expect(mockChatService.sendMessage).toHaveBeenCalledWith('b1', 'u1', 'hello');
    });
  });

  describe('getMessages', () => {
    it('should call getMessages on service', async () => {
      mockChatService.getMessages.mockResolvedValue([{ id: 'msg-1' }]);

      const result = await controller.getMessages('b1', { id: 'u1' });
      expect(result).toEqual([{ id: 'msg-1' }]);
      expect(mockChatService.getMessages).toHaveBeenCalledWith('b1', 'u1');
    });
  });
});
