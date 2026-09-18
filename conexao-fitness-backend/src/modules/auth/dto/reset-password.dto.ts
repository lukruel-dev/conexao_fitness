import { IsEmail, IsNotEmpty, IsString, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'atleta@conexaofitness.com.br' })
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString({ message: 'O código deve ser um texto' })
  @Length(6, 6, { message: 'O código deve ter exatamente 6 dígitos' })
  code: string;

  @ApiProperty({ example: 'novaSenha123' })
  @IsString()
  @MinLength(8, { message: 'A nova senha deve ter no mínimo 8 caracteres' })
  newPassword: string;
}
