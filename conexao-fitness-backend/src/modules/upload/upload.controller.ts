import { Controller, Post, Get, Param, Res, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import * as path from 'path';
import * as fs from 'fs';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('document')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }
    const fileUrl = await this.uploadService.uploadFile(file, 'kyc-documents');
    return { url: fileUrl };
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }
    const fileUrl = await this.uploadService.uploadFile(file, 'avatars');
    return { url: fileUrl };
  }

  @Post('portfolio')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPortfolio(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }
    const fileUrl = await this.uploadService.uploadFile(file, 'portfolios');
    return { url: fileUrl };
  }

  @Get('file/:folder/:filename')
  getFile(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res() res: any,
  ) {
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '');
    const filePath = path.join(process.cwd(), 'uploads', safeFolder, safeFilename);

    if (!fs.existsSync(filePath)) {
      res.status(404).send(
        `<!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="utf-8"><title>Documento não encontrado</title>
        <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#09090b;color:#fafafa;text-align:center;}</style>
        </head>
        <body>
          <div>
            <h2 style="color:#ef4444">Arquivo não encontrado</h2>
            <p style="color:#a1a1aa">Este documento foi submetido em uma sessão anterior ou não está mais no servidor temporário.</p>
            <p style="color:#a1a1aa">Por favor, solicite ao profissional que reenvie o documento pelo seu perfil.</p>
          </div>
        </body>
        </html>`
      );
      return;
    }

    const ext = path.extname(safeFilename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }
}

