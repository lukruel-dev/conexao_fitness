import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MembershipsService } from './memberships.service';
import { CreateMembershipPlanDto } from './dto/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from './dto/update-membership-plan.dto';
import { EnrollOnlineDto } from './dto/enroll-online.dto';
import { ManualEnrollmentDto } from './dto/manual-enrollment.dto';
import { ValidateAccessDto } from './dto/validate-access.dto';
import { RenewEnrollmentDto } from './dto/renew-enrollment.dto';
import { FilterEnrollmentsDto } from './dto/filter-enrollments.dto';
import { ChargeDayPassDto } from './dto/charge-daypass.dto';
import { EnrollmentStatus } from './entities/gym-enrollment.entity';

@ApiTags('Gestão de Academias & Matrículas')
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  // =========================================================================
  // STATUS DE PLANO E GATING
  // =========================================================================

  @ApiOperation({ summary: 'Verifica o status de assinatura e permissão do plano da academia' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('tier/status')
  async getTierStatus(@CurrentUser() user: any) {
    return this.membershipsService.checkGymPlanTier(user.id);
  }

  // =========================================================================
  // GESTÃO DE PLANOS DE MATRÍCULA
  // =========================================================================

  @ApiOperation({ summary: 'Listar planos de matrícula cadastrados pela academia logada' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('plans/my')
  async getMyPlans(@CurrentUser() user: any) {
    return this.membershipsService.getMyPlans(user.id);
  }

  @ApiOperation({ summary: 'Criar novo plano de matrícula (exclusivo a partir do Plano Essencial)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('plans')
  async createPlan(
    @CurrentUser() user: any,
    @Body() dto: CreateMembershipPlanDto,
  ) {
    return this.membershipsService.createPlan(user.id, dto);
  }

  @ApiOperation({ summary: 'Atualizar plano de matrícula existente' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('plans/:id')
  async updatePlan(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMembershipPlanDto,
  ) {
    return this.membershipsService.updatePlan(user.id, id, dto);
  }

  @ApiOperation({ summary: 'Desativar plano de matrícula' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('plans/:id')
  async deletePlan(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.membershipsService.deletePlan(user.id, id);
  }

  @ApiOperation({ summary: 'Listar planos públicos de uma academia (para alunos)' })
  @Get('plans/academia/:academiaId')
  async getPublicPlansByAcademia(
    @Param('academiaId', ParseUUIDPipe) academiaId: string,
  ) {
    return this.membershipsService.getPublicPlansByAcademia(academiaId);
  }

  // =========================================================================
  // MATRÍCULAS ONLINE E BALCÃO
  // =========================================================================

  @ApiOperation({ summary: 'Aluno realiza matrícula online em um plano da academia' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('enroll-online/:academiaId')
  async enrollOnline(
    @CurrentUser() user: any,
    @Param('academiaId', ParseUUIDPipe) academiaId: string,
    @Body() dto: EnrollOnlineDto,
  ) {
    return this.membershipsService.enrollOnline(user.id, academiaId, dto);
  }

  @ApiOperation({ summary: 'Buscar aluno cadastrado no Finex por CPF ou e-mail' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('lookup-student')
  async lookupStudent(@Query('query') query: string) {
    return this.membershipsService.lookupStudent(query);
  }

  @ApiOperation({ summary: 'Academia cadastra matrícula manual no balcão' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('enrollments/manual')
  async createManualEnrollment(
    @CurrentUser() user: any,
    @Body() dto: ManualEnrollmentDto,
  ) {
    return this.membershipsService.createManualEnrollment(user.id, dto);
  }

  @ApiOperation({ summary: 'Academia lista suas matrículas e alunos com filtros de busca' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('enrollments/my')
  async listMyEnrollments(
    @CurrentUser() user: any,
    @Query() filters: FilterEnrollmentsDto,
  ) {
    return this.membershipsService.listMyEnrollments(user.id, filters);
  }

  @ApiOperation({ summary: 'Renovar matrícula de um aluno (+dias)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('enrollments/:id/renew')
  async renewEnrollment(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RenewEnrollmentDto,
  ) {
    return this.membershipsService.renewEnrollment(user.id, id, dto);
  }

  @ApiOperation({ summary: 'Atualizar status da matrícula (ex: SUSPENDED, CANCELLED, ACTIVE)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('enrollments/:id/status')
  async updateEnrollmentStatus(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: EnrollmentStatus,
    @Body('notes') notes?: string,
  ) {
    return this.membershipsService.updateEnrollmentStatus(user.id, id, status, notes);
  }

  // =========================================================================
  // CATRACA DIGITAL & LEITURA DE QR CODE
  // =========================================================================

  @ApiOperation({ summary: 'Cobrança de Day Pass debitado diretamente da carteira Finex do aluno' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('charge-daypass')
  async chargeDayPass(
    @CurrentUser() user: any,
    @Body() dto: ChargeDayPassDto,
  ) {
    return this.membershipsService.chargeDayPass(user.id, dto);
  }

  @ApiOperation({ summary: 'Obter preço configurado de Day Pass da academia' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('daypass-price/my')
  async getMyDayPassPrice(@CurrentUser() user: any) {
    const price = await this.membershipsService.getDayPassPrice(user.id);
    return { dayPassPrice: price };
  }

  @ApiOperation({ summary: 'Validação de QR Code de entrada na catraca/recepção da academia' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('validate-access')
  async validateAccess(
    @CurrentUser() user: any,
    @Body() dto: ValidateAccessDto,
  ) {
    return this.membershipsService.validateAccess(user.id, dto);
  }

  @ApiOperation({ summary: 'Histórico de check-ins e acessos da academia' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('access-logs/my')
  async getAccessLogs(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
  ) {
    return this.membershipsService.getGymAccessLogs(user.id, limit ? Number(limit) : 60);
  }

  @ApiOperation({ summary: 'Dashboard e indicadores da academia (MRR, Alunos Ativos, Check-ins)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('dashboard-stats/my')
  async getDashboardStats(@CurrentUser() user: any) {
    return this.membershipsService.getGymDashboardStats(user.id);
  }

  // =========================================================================
  // ÁREA DO ALUNO (PASSES E MINHAS MATRÍCULAS)
  // =========================================================================

  @ApiOperation({ summary: 'Aluno visualiza todas as suas matrículas em academias' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('student/my-enrollments')
  async getStudentEnrollments(@CurrentUser() user: any) {
    return this.membershipsService.getStudentEnrollments(user.id);
  }

  @ApiOperation({ summary: 'Aluno obtém o Passe Digital com QR Code de uma matrícula ativa' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('student/pass/:enrollmentId')
  async getStudentPass(
    @CurrentUser() user: any,
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
  ) {
    return this.membershipsService.getStudentPass(user.id, enrollmentId);
  }

  @ApiOperation({ summary: 'Estatísticas de Lotação e Horários de Pico da Academia (Público)' })
  @Get('gym/:academiaId/crowd-stats')
  async getGymCrowdStats(
    @Param('academiaId', ParseUUIDPipe) academiaId: string,
  ) {
    return this.membershipsService.getGymCrowdStats(academiaId);
  }

  @ApiOperation({ summary: 'Estatísticas de Lotação da própria academia logada' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('crowd-stats/my')
  async getMyCrowdStats(@CurrentUser() user: any) {
    return this.membershipsService.getGymCrowdStats(user.id);
  }
}
