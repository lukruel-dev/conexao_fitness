import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('EmailService', () => {
  let service: EmailService;

  const mockTransporter = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    (nodemailer.createTestAccount as jest.Mock).mockResolvedValue({
      user: 'test_user',
      pass: 'test_pass',
    });
    
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
    
    // aguarda o initTransporter ser finalizado (chamado no construtor)
    await new Promise(process.nextTick); 
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.SMTP_HOST;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg1' });
      (nodemailer.getTestMessageUrl as jest.Mock).mockReturnValue('http://preview.com');

      await service.sendEmail('to@test.com', 'Subject', 'html');
      
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Conexão Fitness" <noreply@conexaofitness.com.br>',
        to: 'to@test.com',
        subject: 'Subject',
        html: 'html',
      });
    });

    it('should handle send failure gracefully', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Send error'));
      
      await expect(service.sendEmail('to@test.com', 'Subject', 'html')).resolves.toBeUndefined();
    });
  });
});
