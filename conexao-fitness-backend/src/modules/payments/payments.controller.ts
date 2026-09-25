import { Controller, Post, Get, UseGuards, Body, ForbiddenException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getAccountStatus(@CurrentUser() user: any) {
    return this.paymentsService.getAccountStatus(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('onboard')
  async onboardProvider(@CurrentUser() user: any, @Body('returnPath') returnPath?: string) {
    if (user.role === 'STUDENT') {
      throw new ForbiddenException('Apenas profissionais (personal) e academias podem conectar conta de recebimento.');
    }
    const url = await this.paymentsService.getOnboardingLink(user.id, returnPath);
    return { url };
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscriptions')
  async createSubscription(
    @Body('priceId') priceId: string,
    @Body('planName') planName: string,
    @CurrentUser() user: any,
  ) {
    if (!priceId) {
      return { error: 'priceId is required' };
    }
    return this.paymentsService.createSubscriptionPaymentIntent(user?.id, priceId, planName);
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscriptions/confirm')
  async confirmSubscription(
    @CurrentUser() user: any,
    @Body('planName') planName: string,
    @Body('subscriptionId') subscriptionId?: string,
  ) {
    return this.paymentsService.confirmSubscription(user.id, planName, subscriptionId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscriptions/cancel')
  async cancelSubscription(@CurrentUser() user: any) {
    return this.paymentsService.confirmSubscription(user.id, 'Gratuito');
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-intent')
  async createIntent(
    @CurrentUser() user: any,
    @Body() dto: {
      providerId: string;
      amount: number;
      purpose: 'PLAN_HIRING' | 'ENROLLMENT';
      title: string;
      referenceId: string;
    },
  ) {
    return this.paymentsService.createPaymentIntentForCheckout({
      studentId: user.id,
      providerId: dto.providerId,
      amount: Number(dto.amount),
      purpose: dto.purpose,
      title: dto.title,
      referenceId: dto.referenceId,
    });
  }
}

