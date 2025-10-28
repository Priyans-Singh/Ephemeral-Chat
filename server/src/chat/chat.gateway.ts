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
  // Rate limiting: userId -> array of timestamps
  private messageTimestamps = new Map<string, number[]>();

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
      console.log(`🔌 Socket ${client.id}: Connection attempt`);
      
      // Extract token from handshake
      const token = this.extractTokenFromHandshake(client);
      if (!token) {
        console.warn(`❌ Socket ${client.id}: No token provided`);
        client.emit('auth_error', { message: 'No authentication token provided', code: 'NO_TOKEN' });
        client.disconnect(true);
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (!payload || !payload.sub) {
        console.warn(`Socket ${client.id}: Invalid token payload`);
        client.emit('auth_error', { message: 'Invalid token payload', code: 'INVALID_PAYLOAD' });
        client.disconnect(true);
        return;
      }

      // Verify user exists in database
      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        console.warn(`Socket ${client.id}: User not found for ID ${payload.sub}`);
        client.emit('auth_error', { message: 'User not found', code: 'USER_NOT_FOUND' });
        client.disconnect(true);
        return;
      }

      // Store user data in socket
      client.data.user = user;
      client.data.userId = user.id;

      console.log(`✅ Socket connected: ${client.id}, User: ${user.displayName}`);

      // Remove any existing connection for this user to prevent duplicates
      const existingSocketId = this.userSockets.get(user.id);
      if (existingSocketId && existingSocketId !== client.id) {
        console.log(`🔄 Replacing existing connection for user ${user.displayName}`);
        const existingSocket = this.server.sockets.sockets.get(existingSocketId);
        if (existingSocket) {
          existingSocket.disconnect(true);
        }
      }

      // Add user to our maps and broadcast the new list
      this.connectedUsers.set(user.id, user);
      this.userSockets.set(user.id, client.id);
      this.broadcastUserList();

      // Send connection confirmation
      client.emit('connection_confirmed', { 
        message: 'Successfully connected',
        user: {
          id: user.id,
          displayName: user.displayName
        }
      });

    } catch (error) {
      console.error(`Socket ${client.id}: Authentication failed`, error.message);
      
      // Send specific error messages based on error type
      if (error.name === 'TokenExpiredError') {
        client.emit('auth_error', { message: 'Token expired', code: 'TOKEN_EXPIRED' });
      } else if (error.name === 'JsonWebTokenError') {
        client.emit('auth_error', { message: 'Invalid token', code: 'INVALID_TOKEN' });
      } else {
        client.emit('auth_error', { message: 'Authentication failed', code: 'AUTH_FAILED' });
      }
      
      client.disconnect(true);
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

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      console.log(`🔌 Socket disconnected: ${client.id}, User: ${user.displayName}`);

      // Only remove from maps if this is the current socket for this user
      const currentSocketId = this.userSockets.get(user.id);
      if (currentSocketId === client.id) {
        this.connectedUsers.delete(user.id);
        this.userSockets.delete(user.id);
        // Clean up rate limiting data
        this.messageTimestamps.delete(user.id);
        this.broadcastUserList();
      }
    } else {
      console.log(`🔌 Socket disconnected: ${client.id}, User: Unknown`);
    }
  }

  private isRateLimited(userId: string): boolean {
    const now = Date.now();
    const timestamps = this.messageTimestamps.get(userId) || [];
    
    // Remove timestamps older than 1 minute
    const recentTimestamps = timestamps.filter(timestamp => now - timestamp < 60000);
    
    // Allow max 30 messages per minute
    if (recentTimestamps.length >= 30) {
      return true;
    }
    
    // Add current timestamp and update the map
    recentTimestamps.push(now);
    this.messageTimestamps.set(userId, recentTimestamps);
    
    return false;
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { to: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Double-check authentication (defense in depth)
      const sender = client.data.user;
      if (!sender) {
        console.warn(`Socket ${client.id} attempted to send message without authentication`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      // Rate limiting check
      if (this.isRateLimited(sender.id)) {
        console.warn(`Socket ${client.id} rate limited for user ${sender.displayName}`);
        client.emit('error', { message: 'Too many messages. Please slow down.' });
        return;
      }

      // Validate message data
      if (!data.to || !data.content || typeof data.content !== 'string') {
        console.warn(`Socket ${client.id} sent invalid message data`);
        client.emit('error', { message: 'Invalid message data' });
        return;
      }

      // Sanitize message content
      const sanitizedContent = data.content.trim();
      if (sanitizedContent.length === 0) {
        client.emit('error', { message: 'Message cannot be empty' });
        return;
      }

      if (sanitizedContent.length > 1000) {
        client.emit('error', { message: 'Message too long (max 1000 characters)' });
        return;
      }

      const recipient = await this.usersService.findOne(data.to);
      if (!recipient) {
        console.warn(`Socket ${client.id} attempted to send message to non-existent user: ${data.to}`);
        client.emit('error', { message: 'Recipient not found' });
        return;
      }

      // Prevent sending messages to self
      if (sender.id === recipient.id) {
        client.emit('error', { message: 'Cannot send message to yourself' });
        return;
      }

      // Create and save the message
      const message = this.messageRepository.create({
        content: sanitizedContent,
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
      client.emit('error', { message: 'Failed to send message' });
    }
  }
}