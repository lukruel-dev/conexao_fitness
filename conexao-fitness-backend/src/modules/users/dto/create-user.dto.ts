import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import type { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  password: string;

  @IsEnum(['STUDENT', 'PERSONAL', 'ACADEMIA', 'ADMIN'])
  role: UserRole;
}
