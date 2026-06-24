import { Controller, Patch, Param, UseGuards, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

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
}
