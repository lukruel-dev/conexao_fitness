import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { BadRequestException } from '@nestjs/common';

describe('UploadController', () => {
  let controller: UploadController;
  let service: UploadService;

  const mockService = {
    uploadFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        { provide: UploadService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<UploadController>(UploadController);
    service = module.get<UploadService>(UploadService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadDocument', () => {
    it('should throw BadRequestException if no file', async () => {
      await expect(controller.uploadDocument(undefined)).rejects.toThrow(BadRequestException);
    });

    it('should call uploadFile with kyc-documents', async () => {
      mockService.uploadFile.mockResolvedValue('url');
      const result = await controller.uploadDocument({} as any);
      expect(result).toEqual({ url: 'url' });
      expect(mockService.uploadFile).toHaveBeenCalledWith({}, 'kyc-documents');
    });
  });

  describe('uploadAvatar', () => {
    it('should throw BadRequestException if no file', async () => {
      await expect(controller.uploadAvatar(undefined)).rejects.toThrow(BadRequestException);
    });

    it('should call uploadFile with avatars', async () => {
      mockService.uploadFile.mockResolvedValue('url');
      const result = await controller.uploadAvatar({} as any);
      expect(result).toEqual({ url: 'url' });
      expect(mockService.uploadFile).toHaveBeenCalledWith({}, 'avatars');
    });
  });

  describe('uploadPortfolio', () => {
    it('should throw BadRequestException if no file', async () => {
      await expect(controller.uploadPortfolio(undefined)).rejects.toThrow(BadRequestException);
    });

    it('should call uploadFile with portfolios', async () => {
      mockService.uploadFile.mockResolvedValue('url');
      const result = await controller.uploadPortfolio({} as any);
      expect(result).toEqual({ url: 'url' });
      expect(mockService.uploadFile).toHaveBeenCalledWith({}, 'portfolios');
    });
  });
});
