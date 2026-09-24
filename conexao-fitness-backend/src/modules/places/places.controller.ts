import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { PlacesService } from './places.service';
import { GetNearbyGymsDto } from './dto/get-nearby-gyms.dto';
import { IndicateGymDto } from './dto/indicate-gym.dto';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Locais e Academias (Google Places & Finex)')
@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @ApiOperation({ summary: 'Buscar academias via Google Places (New) e parceiras Finex' })
  @UseGuards(OptionalJwtAuthGuard)
  @Get('gyms')
  async getGyms(
    @Query() dto: GetNearbyGymsDto,
    @CurrentUser() user?: any,
    @Req() req?: Request,
  ) {
    const rawIp = req?.headers['x-forwarded-for'];
    const userIp = Array.isArray(rawIp)
      ? rawIp[0]
      : (typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : req?.socket?.remoteAddress);

    return this.placesService.getGyms(dto, user?.id, userIp);
  }

  @ApiOperation({ summary: 'Indicar academia externa para ingressar no Finex' })
  @UseGuards(OptionalJwtAuthGuard)
  @Post('gyms/:placeId/indicate')
  async indicateGym(
    @Param('placeId') placeId: string,
    @Body() dto: IndicateGymDto,
    @CurrentUser() user?: any,
    @Req() req?: Request,
  ) {
    const rawIp = req?.headers['x-forwarded-for'];
    const userIp = Array.isArray(rawIp)
      ? rawIp[0]
      : (typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : req?.socket?.remoteAddress);

    return this.placesService.indicateGym(placeId, dto, user?.id, userIp);
  }
}
