import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'YOUR_SECRET_KEY', // IMPORTANT: Use an env variable in production
    });
  }

  async validate(payload: any) {
    // The payload is the decoded JWT. We can trust it because the signature was verified.
    return { userId: payload.sub, email: payload.email };
  }
}
