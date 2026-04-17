import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateTopupDto } from './dto/create-topup.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('me/balance')
  async getMyBalance() {
    const fakeUserId = 'user_fake_1';
    return this.walletService.getMyBalance(fakeUserId);
  }

  @Post('topups')
  async createTopup(@Body() dto: CreateTopupDto) {
    const fakeUserId = 'user_fake_1';
    return this.walletService.createTopup(fakeUserId, dto);
  }

  @Post('topups/:id/simulate-success')
  async simulateTopupSuccess(@Param('id') id: string) {
    return this.walletService.simulateTopupSuccess(id);
  }

  @Post('qr-charges/:id/pay-with-credits')
  async payQrWithCredits(@Param('id') id: string) {
    const fakeUserId = 'user_fake_1';
    return this.walletService.payQrWithCredits(fakeUserId, id);
  }
}
