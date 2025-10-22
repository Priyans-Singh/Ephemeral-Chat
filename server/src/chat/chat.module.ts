import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { ChatController } from './chat.controller'; // Import controller
import { ChatService } from './chat.service';       // Import service

@Module({
  imports: [AuthModule, UsersModule, TypeOrmModule.forFeature([Message])],
  controllers: [ChatController], // Add controller
  providers: [ChatGateway, WsJwtGuard, ChatService], // Add service
})
export class ChatModule {}