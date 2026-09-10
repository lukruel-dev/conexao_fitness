import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateTopupDto } from './dto/create-topup.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
import { SavePixSettingsDto } from './dto/save-pix-settings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Carteira e Pagamentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('me/balance')
  @ApiOperation({ summary: 'Obter saldo da carteira e configurações PIX' })
  async getMyBalance(@CurrentUser() user: any) {
    return this.walletService.getMyBalance(user.id);
  }

  @Get('statement')
  @ApiOperation({ summary: 'Obter extrato completo de recebimentos, acessos e transações' })
  async getStatement(@CurrentUser() user: any) {
    return this.walletService.getStatement(user.id);
  }

  @Post('withdrawals')
  @ApiOperation({ summary: 'Solicitar saque via PIX' })
  async requestWithdrawal(
    @Body() dto: RequestWithdrawalDto,
    @CurrentUser() user: any,
  ) {
    return this.walletService.requestWithdrawal(user.id, dto);
  }

  @Get('withdrawals')
  @ApiOperation({ summary: 'Listar histórico de saques realizados' })
  async getWithdrawals(@CurrentUser() user: any) {
    return this.walletService.getWithdrawals(user.id);
  }

  @Post('pix-settings')
  @ApiOperation({ summary: 'Salvar dados e chave PIX padrão para saques' })
  async savePixSettings(
    @Body() dto: SavePixSettingsDto,
    @CurrentUser() user: any,
  ) {
    return this.walletService.savePixSettings(user.id, dto);
  }

  @Post('topups')
  @ApiOperation({ summary: 'Criar intenção de recarga de saldo' })
  async createTopup(@Body() dto: CreateTopupDto, @CurrentUser() user: any) {
    return this.walletService.createTopup(user.id, dto);
  }

  @Post('topups/:id/simulate-success')
  @ApiOperation({ summary: 'Simular sucesso na recarga' })
  async simulateTopupSuccess(@Param('id') id: string) {
    return this.walletService.simulateTopupSuccess(id);
  }

  @Post('qr-charges/:id/pay-with-credits')
  @ApiOperation({ summary: 'Pagar cobrança QR com saldo' })
  async payQrWithCredits(@Param('id') id: string, @CurrentUser() user: any) {
    return this.walletService.payQrWithCredits(user.id, id);
  }
}
