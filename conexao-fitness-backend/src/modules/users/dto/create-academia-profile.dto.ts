import { IsString, IsOptional } from 'class-validator';

export class CreateAcademiaProfileDto {
  @IsString()
  razaoSocial: string;

  @IsString()
  nomeFantasia: string;

  @IsString()
  cnpj: string;

  // URL do documento do CNPJ ou de identificação do sócio (AWS S3)
  @IsString()
  documentUrl: string;
}
