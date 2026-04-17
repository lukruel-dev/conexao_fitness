export class CreateUserDto {
  email: string;
  password: string;
  type: 'ALUNO' | 'PERSONAL' | 'ACADEMIA';
  fullName?: string; // para aluno/personal
  nomeFantasia?: string; // para academia
}
