import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import * as fs from 'fs';
import { InternalServerErrorException } from '@nestjs/common';

jest.mock('fs');

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadService],
    }).compile();

    service = module.get<UploadService>(UploadService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.APP_URL;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should save file and return url', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      process.env.APP_URL = 'http://test.com';

      const mockFile = { originalname: 'test.jpg', buffer: Buffer.from('abc') } as Express.Multer.File;
      
      const url = await service.uploadFile(mockFile, 'avatars');
      
      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(url).toMatch(/^http:\/\/test\.com\/uploads\/avatars\/\d+-\d+\.jpg$/);
    });

    it('should throw InternalServerErrorException on error', async () => {
      (fs.existsSync as jest.Mock).mockImplementation(() => { throw new Error('fs error'); });
      const mockFile = { originalname: 'test.jpg' } as Express.Multer.File;
      
      await expect(service.uploadFile(mockFile, 'avatars')).rejects.toThrow(InternalServerErrorException);
    });
  });
});
