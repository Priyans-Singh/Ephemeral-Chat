import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './users/user.entity';
import { Message } from './chat/entities/message.entity';
import { Group } from './groups/entities/group.entity';
import { GroupMember } from './groups/entities/group-member.entity';
import { GroupMessage } from './groups/entities/group-message.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module'; // Import the ChatModule
import { GroupsModule } from './groups/groups.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'password',
      database: process.env.DATABASE_NAME || 'flash_groups_db',
      entities: [User, Message, Group, GroupMember, GroupMessage],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    ChatModule,
    GroupsModule, // Add the ChatModule to the imports array
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}