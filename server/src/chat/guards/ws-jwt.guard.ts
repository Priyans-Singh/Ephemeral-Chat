import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    
    try {
      const token = this.extractTokenFromHandshake(client);
      
      if (!token) {
        this.logger.warn(`Socket ${client.id}: No token provided`);
        client.emit('auth_error', { message: 'No authentication token provided' });
        client.disconnect(true);
        return false;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (!payload || !payload.sub) {
        this.logger.warn(`Socket ${client.id}: Invalid token payload`);
        client.emit('auth_error', { message: 'Invalid token payload' });
        client.disconnect(true);
        return false;
      }

      // Verify user exists in database
      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        this.logger.warn(`Socket ${client.id}: User not found for ID ${payload.sub}`);
        client.emit('auth_error', { message: 'User not found' });
        client.disconnect(true);
        return false;
      }

      // Store user data in socket
      client.data.user = user;
      client.data.userId = user.id;
      
      this.logger.log(`Socket ${client.id}: Authentication successful for user ${user.displayName}`);
      return true;

    } catch (error) {
      this.logger.error(`Socket ${client.id}: Authentication failed`, error.message);
      
      // Send specific error messages based on error type
      if (error.name === 'TokenExpiredError') {
        client.emit('auth_error', { message: 'Token expired', code: 'TOKEN_EXPIRED' });
      } else if (error.name === 'JsonWebTokenError') {
        client.emit('auth_error', { message: 'Invalid token', code: 'INVALID_TOKEN' });
      } else {
        client.emit('auth_error', { message: 'Authentication failed', code: 'AUTH_FAILED' });
      }
      
      client.disconnect(true);
      return false;
    }
  }

  private extractTokenFromHandshake(client: Socket): string | undefined {
    // Try multiple sources for the token
    const authHeader = client.handshake.auth?.token;
    const queryToken = client.handshake.query?.token;
    
    // Check auth header first
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) {
        return token;
      }
    }
    
    // Fallback to query parameter
    if (typeof queryToken === 'string') {
      return queryToken;
    }
    
    return undefined;
  }
}