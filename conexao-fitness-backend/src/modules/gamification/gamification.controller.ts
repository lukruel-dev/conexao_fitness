import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Gamificação & Finex Points')
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('summary')
  async getSummary(@CurrentUser() user: any) {
    return this.gamificationService.getGamificationSummary(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('activity')
  async recordActivity(
    @CurrentUser() user: any,
    @Body() body: { type: 'CHECKIN' | 'WORKOUT' | 'ENROLLMENT'; description?: string },
  ) {
    return this.gamificationService.recordActivity(
      user.id,
      body.type || 'WORKOUT',
      body.description,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('redeem')
  async redeemPoints(
    @CurrentUser() user: any,
    @Body() body: { type: 'WALLET_CASH' | 'DAY_PASS'; pointsAmount: number },
  ) {
    return this.gamificationService.redeemPoints(user.id, body);
  }
}
