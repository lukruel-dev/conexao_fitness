import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { OAuthAuthDto } from './dto/oauth-auth.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { SendVerificationCodeDto } from './dto/send-verification-code.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Autenticação e Identidade')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Cadastra um novo usuário e envia código de verificação por e-mail' })
  async register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verifica o e-mail do usuário com o código de 6 dígitos' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reenvia um novo código de verificação por e-mail' })
  async resendVerificationCode(@Body() dto: SendVerificationCodeDto) {
    return this.authService.resendVerificationCode(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Envia código de recuperação de senha por e-mail' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redefine a senha do usuário com o código de 6 dígitos' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return this.authService.login(user);
  }

  @Post('oauth')
  @HttpCode(HttpStatus.OK)
  async oauth(@Body() dto: OAuthAuthDto) {
    return this.authService.oauthLoginOrRegister(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: any) {
    const userProfile = await this.authService.getUserProfile(req.user.id);
    return { user: userProfile };
  }
}
