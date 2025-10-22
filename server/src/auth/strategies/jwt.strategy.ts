import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'YOUR_SECRET_KEY',
    });
  }

  async validate(payload: any) {
    // Get the full user profile from the database
    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      return null;
    }
    // Return the full user object (without password)
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
