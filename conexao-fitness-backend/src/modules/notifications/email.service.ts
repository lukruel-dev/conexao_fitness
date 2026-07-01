import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.initTransporter();
  }

  private async initTransporter() {
    // Para MVP, vamos usar o Ethereal Email (fake SMTP for testing)
    // Se no .env existir SMTP_HOST real, ele usa. Senão, cria uma conta de teste.
    const host = process.env.SMTP_HOST;
    if (host) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      this.logger.log('SMTP Transport configurado a partir do .env');
    } else {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });
      this.logger.log(`Ethereal Email configurado. User: ${testAccount.user}`);
    }
  }

  async sendEmail(to: string, subject: string, html: string) {
    if (!this.transporter) {
      this.logger.warn('Transporter não está pronto. Ignorando envio.');
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: '"Conexão Fitness" <noreply@conexaofitness.com.br>',
        to,
        subject,
        html,
      });

      this.logger.log(`Email enviado: ${info.messageId}`);
      
      // Se estivermos usando Ethereal, logamos a URL de preview
      if (!process.env.SMTP_HOST) {
        this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } catch (error) {
      this.logger.error(`Erro ao enviar email para ${to}: ${error.message}`);
    }
  }
}
