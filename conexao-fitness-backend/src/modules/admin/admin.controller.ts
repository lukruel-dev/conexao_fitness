import { Controller, Patch, Param, UseGuards, Body, Get, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole, UserStatus } from '../users/entities/user.entity';
import { BookingStatus } from '../bookings/entities/booking.entity';

@ApiTags('Painel Admin (Backoffice)')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Patch('users/:id/kyc-approve')
  approveKyc(@Param('id') userId: string) {
    return this.adminService.approveKyc(userId);
  }

  @Patch('users/:id/kyc-reject')
  rejectKyc(@Param('id') userId: string, @Body('reason') reason: string) {
    return this.adminService.rejectKyc(userId, reason || 'Documentação inválida');
  }

  @Get('dashboard')
  getDashboardMetrics() {
    return this.adminService.getDashboardMetrics();
  }

  @Get('users')
  findAllUsers(
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.findAllUsers(role as UserRole, status as UserStatus);
  }

  @Get('bookings')
  findAllBookings(
    @Query('status') status?: string,
  ) {
    return this.adminService.findAllBookings(status as BookingStatus);
  }

  @Patch('users/:id/suspend')
  suspendUser(@Param('id') userId: string) {
    return this.adminService.suspendUser(userId);
  }

  @Patch('users/:id/activate')
  activateUser(@Param('id') userId: string) {
    return this.adminService.activateUser(userId);
  }
}
