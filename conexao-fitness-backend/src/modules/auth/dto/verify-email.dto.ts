import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ example: 'atleta@conexaofitness.com.br' })
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString({ message: 'O código deve ser um texto' })
  @Length(6, 6, { message: 'O código de verificação deve ter exatamente 6 dígitos' })
  code: string;
}
