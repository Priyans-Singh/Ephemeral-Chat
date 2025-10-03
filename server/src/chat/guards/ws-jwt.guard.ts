import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Import ConfigService
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private configService: ConfigService, // Inject ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    try {
      const token = this.extractTokenFromHandshake(client);
      if (!token) {
        throw new WsException('Unauthorized: No token provided');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'), // Read from .env
      });

      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        throw new WsException('Unauthorized: User not found');
      }

      client.data.user = user;
      return true;
    } catch (e) {
      console.error('WsJwtGuard Error:', e.message);
      client.disconnect();
      return false;
    }
  }

  private extractTokenFromHandshake(client: Socket): string | undefined {
    const [type, token] =
      client.handshake.auth.token?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}