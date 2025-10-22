import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async getHistory(userId: string, recipientId: string) {
    return this.messageRepository.find({
      where: [
        { sender: { id: userId }, recipient: { id: recipientId } },
        { sender: { id: recipientId }, recipient: { id: userId } },
      ],
      order: { createdAt: 'ASC' },
      relations: ['sender', 'recipient'],
    });
  }
}
