import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): any {
    return {
      status: 'online',
      message: 'Conexão Fitness API 🚀 - Marketplace de Saúde e Fitness',
      docs: '/api/docs',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ping')
  ping(): any {
    return { ok: true, timestamp: new Date().toISOString() };
  }
}