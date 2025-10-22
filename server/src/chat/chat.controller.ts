import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { Request } from 'express';

@Controller('chat')
@UseGuards(JwtAuthGuard) // Protect all routes in this controller
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('history/:recipientId')
  async getChatHistory(
    @Param('recipientId') recipientId: string,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).id;
    return this.chatService.getHistory(userId, recipientId);
  }
}