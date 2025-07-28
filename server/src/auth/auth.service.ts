import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  async googleLogin(req) {
    if (!req.user) {
      throw new UnauthorizedException('No user from google');
    }

    let user = await this.usersService.findOneByEmail(req.user.email);

    if (!user) {
      // FIX: Create a simple object and remove the problematic 'as CreateUserDto' cast.
      // This now works because our usersService.create method is more flexible.
      user = await this.usersService.create({
        email: req.user.email,
        displayName: req.user.displayName,
        googleId: req.user.googleId,
      });
    }

    return this.login(user);
  }
}
