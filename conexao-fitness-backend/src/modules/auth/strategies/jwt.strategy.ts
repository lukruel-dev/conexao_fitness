import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'SECRET_KEY_PROVISORIO', // TODO: Usar ConfigModule/.env
    });
  }

  async validate(payload: any) {
    // Esse objeto vai para request.user
    return { id: payload.sub, email: payload.email, type: payload.type, status: payload.status };
  }
}
