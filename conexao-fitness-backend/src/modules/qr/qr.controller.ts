import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { QRService } from './qr.service';
import { CreateQrChargeDto } from './dto/create-qr-charge.dto';

@Controller('qr-charges')
export class QRController {
  constructor(private readonly qrService: QRService) {}

  // Provedor cria QR (por enquanto provider fake)
  @Post()
  async createQrCharge(@Body() dto: CreateQrChargeDto) {
    const fakeProviderId = 'provider_fake_1';
    return this.qrService.createQrCharge(fakeProviderId, dto);
  }

  // Aluno consulta info do QR pelo ID
  @Get(':id')
  async getQrCharge(@Param('id') id: string) {
    const data = await this.qrService.getQrCharge(id);
    if (!data) {
      return { error: 'QRCharge not found' };
    }
    return data;
  }
}