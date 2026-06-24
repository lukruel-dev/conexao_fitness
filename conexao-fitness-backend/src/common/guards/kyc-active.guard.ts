import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class KycActiveGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }
    
    // Alunos não precisam de KYC restrito, mas Personais/Academias precisam para publicar/vender
    if (user.type === 'ALUNO') {
      return true;
    }

    if (user.status !== 'ATIVO') {
      throw new ForbiddenException('Seu perfil ainda não foi aprovado (KYC Pendente). Envie seus documentos e aguarde a moderação.');
    }
    
    return true;
  }
}
