import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // Se não houver token ou for inválido, não lança erro, apenas retorna null ou undefined
    return user || null;
  }
}
