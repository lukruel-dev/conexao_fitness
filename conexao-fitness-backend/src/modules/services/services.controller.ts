import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { KycActiveGuard } from '../../common/guards/kyc-active.guard';
import { CreateScheduleSlotDto } from './dto/create-schedule-slot.dto';
import { UpdateScheduleSlotDto } from './dto/update-schedule-slot.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Serviços e Agenda (Profissionais)')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard, KycActiveGuard)
  @Roles('PERSONAL', 'ACADEMIA')
  @Post()
  create(@Body() dto: CreateServiceDto) {
    // Para o MVP assumimos que providerId e providerType vêm no DTO
    return this.servicesService.create(dto);
  }

  @Get()
  findAll() {
    return this.servicesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOneOrFail(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, KycActiveGuard)
  @Roles('PERSONAL', 'ACADEMIA')
  @Post(':serviceId/slots')
  createScheduleSlotForService(
    @Param('serviceId') serviceId: string,
    @Body() dto: CreateScheduleSlotDto,
  ) {
    return this.servicesService.createScheduleSlotForService(serviceId, dto);
  }

  @Get(':serviceId/slots')
  listScheduleSlotsForService(@Param('serviceId') serviceId: string) {
    return this.servicesService.listScheduleSlotsForService(serviceId);
  }

  @Patch('slots/:slotId')
  updateScheduleSlot(
    @Param('slotId') slotId: string,
    @Body() dto: UpdateScheduleSlotDto,
  ) {
    return this.servicesService.updateScheduleSlot(slotId, dto);
  }

  @Delete('slots/:slotId')
  deleteScheduleSlot(@Param('slotId') slotId: string) {
    return this.servicesService.deleteScheduleSlot(slotId);
  }
}