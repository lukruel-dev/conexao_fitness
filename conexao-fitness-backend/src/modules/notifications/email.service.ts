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
      const fromAddress = process.env.SMTP_FROM || (process.env.SMTP_USER ? `"Conexão Fitness" <${process.env.SMTP_USER}>` : '"Conexão Fitness" <noreply@finex.net.br>');
      const info = await this.transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
      });

      this.logger.log(`Email enviado: ${info.messageId}`);
      
      // Se estivermos usando Ethereal, logamos a URL de preview
      if (!process.env.SMTP_HOST) {
        this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } catch (error: any) {
      this.logger.error(`Erro ao enviar email para ${to}: ${error.message}`);
    }
  }

  /**
   * Envia e-mail com código de 6 dígitos para verificação de conta
   */
  async sendVerificationCode(to: string, name: string, code: string) {
    const firstName = name ? name.split(' ')[0] : 'Atleta';
    const subject = `${code} é o seu código de verificação — Conexão Fitness`;

    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirme seu e-mail</title>
      <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #e2e8f0; }
        .container { max-width: 560px; margin: 40px auto; background-color: #131b26; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; }
        .header p { margin: 6px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500; }
        .content { padding: 36px 32px; }
        .greeting { font-size: 18px; font-weight: 600; color: #f8fafc; margin-bottom: 16px; }
        .text { font-size: 15px; line-height: 1.6; color: #94a3b8; margin-bottom: 28px; }
        .code-box { background-color: #0b0f17; border: 2px dashed #10b981; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px; }
        .code-label { font-size: 12px; text-transform: uppercase; tracking: 1px; color: #10b981; font-weight: 700; margin-bottom: 8px; }
        .code-value { font-size: 38px; font-family: 'Courier New', Courier, monospace; font-weight: 800; letter-spacing: 8px; color: #ffffff; margin: 0; }
        .alert-box { background-color: rgba(16, 185, 129, 0.08); border-left: 4px solid #10b981; padding: 14px 16px; border-radius: 4px; font-size: 13px; color: #cbd5e1; margin-bottom: 24px; }
        .footer { background-color: #0b0f17; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; }
        .footer p { margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CONEXÃO FITNESS</h1>
          <p>Validação de Segurança e Autenticação</p>
        </div>
        <div class="content">
          <div class="greeting">Olá, ${firstName}!</div>
          <div class="text">
            Obrigado por se cadastrar na <strong>Conexão Fitness</strong>. Para concluir a criação da sua conta e proteger a segurança dos seus dados, utilize o código de verificação abaixo:
          </div>
          <div class="code-box">
            <div class="code-label">Código de Confirmação</div>
            <div class="code-value">${code}</div>
          </div>
          <div class="alert-box">
            ⏱️ <strong>Atenção:</strong> Este código expira em <strong>15 minutos</strong>. Por motivos de segurança, nunca compartilhe este código com ninguém.
          </div>
          <div class="text" style="font-size: 13px; color: #64748b; margin-bottom: 0;">
            Se você não iniciou este cadastro na Conexão Fitness, ignore esta mensagem ou avise nosso suporte.
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Conexão Fitness. Todos os direitos reservados.</p>
          <p>Ecossistema inteligente para Alunos, Personais e Academias.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    await this.sendEmail(to, subject, html);
  }

  /**
   * Envia e-mail com código para recuperação e redefinição de senha
   */
  async sendPasswordResetEmail(to: string, name: string, code: string) {
    const firstName = name ? name.split(' ')[0] : 'Usuário';
    const subject = `${code} é seu código de recuperação de senha — Conexão Fitness`;

    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperação de Senha</title>
      <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #e2e8f0; }
        .container { max-width: 560px; margin: 40px auto; background-color: #131b26; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; }
        .header p { margin: 6px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500; }
        .content { padding: 36px 32px; }
        .greeting { font-size: 18px; font-weight: 600; color: #f8fafc; margin-bottom: 16px; }
        .text { font-size: 15px; line-height: 1.6; color: #94a3b8; margin-bottom: 28px; }
        .code-box { background-color: #0b0f17; border: 2px dashed #3b82f6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px; }
        .code-label { font-size: 12px; text-transform: uppercase; tracking: 1px; color: #3b82f6; font-weight: 700; margin-bottom: 8px; }
        .code-value { font-size: 38px; font-family: 'Courier New', Courier, monospace; font-weight: 800; letter-spacing: 8px; color: #ffffff; margin: 0; }
        .alert-box { background-color: rgba(59, 130, 246, 0.08); border-left: 4px solid #3b82f6; padding: 14px 16px; border-radius: 4px; font-size: 13px; color: #cbd5e1; margin-bottom: 24px; }
        .footer { background-color: #0b0f17; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; }
        .footer p { margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CONEXÃO FITNESS</h1>
          <p>Recuperação de Acesso</p>
        </div>
        <div class="content">
          <div class="greeting">Olá, ${firstName}!</div>
          <div class="text">
            Recebemos uma solicitação para redefinir a senha da sua conta na <strong>Conexão Fitness</strong>. Utilize o código de segurança abaixo para definir sua nova senha:
          </div>
          <div class="code-box">
            <div class="code-label">Código de Redefinição</div>
            <div class="code-value">${code}</div>
          </div>
          <div class="alert-box">
            ⏱️ <strong>Atenção:</strong> Este código é válido por <strong>30 minutos</strong>. Se você não fez esta solicitação, sua senha atual continua segura e você pode desconsiderar esta mensagem.
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Conexão Fitness. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    await this.sendEmail(to, subject, html);
  }
}

