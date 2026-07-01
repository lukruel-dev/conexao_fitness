import { Controller, Get, Put, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  async getMyAvailability(@CurrentUser() user: any) {
    if (user.role === 'STUDENT') {
      throw new ForbiddenException('Only providers can have availability schedules');
    }
    return this.availabilityService.getAvailability(user.id);
  }

  @Put()
  async updateMyAvailability(
    @CurrentUser() user: any,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    if (user.role === 'STUDENT') {
      throw new ForbiddenException('Only providers can update availability schedules');
    }
    return this.availabilityService.updateAvailability(user.id, dto);
  }
}
