import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req) {
    const currentUserId = req.user?.id;
    const users = await this.usersService.findAll();
    return users
      .filter((user) => user.id !== currentUserId)
      .map((user) => {
        const { password, ...rest } = user;
        return rest;
      });
  }
}
