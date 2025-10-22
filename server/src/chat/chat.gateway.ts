import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { User } from 'src/users/user.entity';
import { Message } from './entities/message.entity';
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
  // A map to store user socket mappings. Key: userId, Value: socketId
  private userSockets = new Map<string, string>();

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
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

       // Add user to our maps and broadcast the new list
       this.connectedUsers.set(user.id, user);
       this.userSockets.set(user.id, client.id);
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

       // Remove user from our maps and broadcast the new list
       this.connectedUsers.delete(user.id);
       this.userSockets.delete(user.id);
       this.broadcastUserList();
    } else {
        console.log(`Socket disconnected: ${client.id}, User: Unknown`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { to: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const sender = client.data.user;
      if (!sender) {
        console.warn(`Socket ${client.id} attempted to send message without authentication`);
        return;
      }

      const recipient = await this.usersService.findOne(data.to);
      if (!recipient) {
        console.warn(`Socket ${client.id} attempted to send message to non-existent user: ${data.to}`);
        return;
      }

      // Create and save the message
      const message = this.messageRepository.create({
        content: data.content,
        sender,
        recipient,
      });
      const savedMessage = await this.messageRepository.save(message);

      // Prepare message data for clients
      const messageData = {
        id: savedMessage.id,
        content: savedMessage.content,
        createdAt: savedMessage.createdAt,
        sender: {
          id: sender.id,
          displayName: sender.displayName,
        },
        recipient: {
          id: recipient.id,
          displayName: recipient.displayName,
        },
      };

      // Send to recipient if they're online
      const recipientSocketId = this.userSockets.get(recipient.id);
      if (recipientSocketId) {
        this.server.to(recipientSocketId).emit('receiveMessage', messageData);
      }

      // Send back to sender for confirmation
      client.emit('receiveMessage', messageData);

      console.log(`Message sent from ${sender.displayName} to ${recipient.displayName}`);
    } catch (error) {
      console.error(`Error handling message from socket ${client.id}:`, error);
    }
  }
}