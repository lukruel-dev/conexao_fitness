import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import type { UserRole } from '../../users/entities/user.entity';

export class OAuthAuthDto {
  @IsEnum(['google', 'apple'])
  provider: 'google' | 'apple';

  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  token?: string;

  @IsEnum(['STUDENT', 'PERSONAL', 'ACADEMIA', 'ADMIN'])
  @IsOptional()
  role?: UserRole;

  @IsString()
  @IsOptional()
  cpf?: string;

  @IsString()
  @IsOptional()
  cnpj?: string;

  @IsString()
  @IsOptional()
  razaoSocial?: string;

  @IsString()
  @IsOptional()
  nomeFantasia?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  professionTitle?: string;

  @IsString()
  @IsOptional()
  professionalRegistrationId?: string;

  @IsString()
  @IsOptional()
  professionalDocumentUrl?: string;
}
