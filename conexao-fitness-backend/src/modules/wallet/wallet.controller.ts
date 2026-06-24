import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateTopupDto } from './dto/create-topup.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Carteira e Pagamentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('me/balance')
  async getMyBalance(@CurrentUser() user: any) {
    return this.walletService.getMyBalance(user.id);
  }

  @Post('topups')
  async createTopup(@Body() dto: CreateTopupDto, @CurrentUser() user: any) {
    return this.walletService.createTopup(user.id, dto);
  }

  @Post('topups/:id/simulate-success')
  async simulateTopupSuccess(@Param('id') id: string) {
    return this.walletService.simulateTopupSuccess(id);
  }

  @Post('qr-charges/:id/pay-with-credits')
  async payQrWithCredits(@Param('id') id: string, @CurrentUser() user: any) {
    return this.walletService.payQrWithCredits(user.id, id);
  }
}
