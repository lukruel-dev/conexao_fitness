import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PERSONAL', 'ACADEMIA')
  @Post('onboard')
  async onboardProvider(@CurrentUser() user: any) {
    // Apenas PERSONAL ou ACADEMIA
    if (user.role === 'STUDENT') {
      return { error: 'Only providers can onboard' };
    }
    const url = await this.paymentsService.getOnboardingLink(user.id);
    return { url };
  }

  @Post('subscriptions')
  async createSubscription(@Body('priceId') priceId: string, @CurrentUser() user: any) {
    if (user.role === 'STUDENT') {
      return { error: 'Only providers can subscribe' };
    }
    if (!priceId) {
      return { error: 'priceId is required' };
    }
    return this.paymentsService.createSubscriptionCheckout(user.id, priceId);
  }
}
