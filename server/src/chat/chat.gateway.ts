import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Injectable } from '@nestjs/common';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { User } from 'src/users/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';

@UseGuards(WsJwtGuard)
@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
  },
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // A map to store connected users. Key: userId, Value: user object
  private connectedUsers = new Map<string, User>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  private broadcastUserList() {
    const userList = Array.from(this.connectedUsers.values()).map(user => ({
        id: user.id,
        displayName: user.displayName,
    }));
    this.server.emit('users', userList); // Broadcast the 'users' event with the list
  }

  async handleConnection(client: Socket) {
    try {
      // Try to authenticate on connection
      const [type, token] = client.handshake.auth.token?.split(' ') ?? [];
      if (type !== 'Bearer' || !token) {
        console.warn(`Socket ${client.id} missing/invalid token. Disconnecting.`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        console.warn(`Socket ${client.id} user not found. Disconnecting.`);
        client.disconnect();
        return;
      }

      client.data.user = user;
      console.log(`Socket connected: ${client.id}, User: ${user.displayName}`);

      // Add user to our map and broadcast the new list
      this.connectedUsers.set(user.id, user);
      this.broadcastUserList();
    } catch (err: any) {
      console.error(`Socket ${client.id} authentication failed:`, err?.message || err);
      try { client.disconnect(); } catch {}
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      console.log(`Socket disconnected: ${client.id}, User: ${user.displayName}`);

      // Remove user from our map and broadcast the new list
      this.connectedUsers.delete(user.id);
      this.broadcastUserList();
    } else {
        console.log(`Socket disconnected: ${client.id}, User: Unknown`);
    }
  }
}