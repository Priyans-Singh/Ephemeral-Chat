import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { Request } from 'express';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  async create(@Body() createGroupDto: CreateGroupDto, @Req() req: Request) {
    return this.groupsService.createGroup(createGroupDto, (req.user as any));
  }

  @Get()
  async findAll(@Req() req: Request) {
    return this.groupsService.findGroupsForUser((req.user as any).id);
  }
}
