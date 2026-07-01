import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  /**
   * Salva um arquivo localmente na pasta /uploads.
   * Em produção, isso integraria com o aws-sdk-v3 putObject.
   */
  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    this.logger.log(`Fazendo upload do arquivo ${file.originalname} para a pasta uploads/${folder}`);
    
    try {
      const uploadsRoot = path.join(process.cwd(), 'uploads');
      const folderPath = path.join(uploadsRoot, folder);
      
      // Cria o diretório se não existir
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Gera um nome de arquivo único
      const extension = path.extname(file.originalname);
      const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
      const filePath = path.join(folderPath, uniqueFilename);

      // Escreve o arquivo no disco
      fs.writeFileSync(filePath, file.buffer);

      // Monta a URL pública baseada no APP_URL
      const appUrl = process.env.APP_URL || 'http://localhost:3001';
      return `${appUrl}/uploads/${folder}/${uniqueFilename}`;
    } catch (error) {
      this.logger.error('Erro ao salvar arquivo localmente', error);
      throw new InternalServerErrorException('Falha ao processar o upload do arquivo');
    }
  }
}
