import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { UsersService } from '../users/users.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { User } from '../users/user.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private groupMemberRepository: Repository<GroupMember>,
    private usersService: UsersService,
  ) {}

  async createGroup(
    createGroupDto: CreateGroupDto,
    owner: User,
  ): Promise<Group> {
    const normalizedMemberIds = Array.from(
      new Set(
        (createGroupDto.memberIds || []).filter(
          (memberId) => memberId && memberId !== owner.id,
        ),
      ),
    );

    return this.groupRepository.manager.transaction(async (manager) => {
      const groupRepo = manager.getRepository(Group);
      const memberRepo = manager.getRepository(GroupMember);

      const group = groupRepo.create({
        name: createGroupDto.name,
        owner,
      });
      await groupRepo.save(group);

      const ownerMember = memberRepo.create({
        user: owner,
        group,
      });
      await memberRepo.save(ownerMember);

      if (normalizedMemberIds.length) {
        const users = await this.usersService.findByIds(normalizedMemberIds);
        const usersById = new Map(users.map((user) => [user.id, user]));
        const missingMembers = normalizedMemberIds.filter(
          (id) => !usersById.has(id),
        );

        if (missingMembers.length) {
          throw new NotFoundException(
            `Users not found: ${missingMembers.join(', ')}`,
          );
        }

        const membersToPersist = normalizedMemberIds.map((memberId) =>
          memberRepo.create({
            user: usersById.get(memberId)!,
            group,
          }),
        );

        await memberRepo.save(membersToPersist);
      }

      return groupRepo.findOneOrFail({
        where: { id: group.id },
        relations: ['owner', 'members', 'members.user'],
      });
    });
  }

  async findGroupsForUser(userId: string): Promise<Group[]> {
    // Query GroupMember entries for the user
    const groupMembers = await this.groupMemberRepository.find({
      where: { user: { id: userId } },
      relations: ['group', 'group.owner', 'group.members', 'group.members.user'],
    });

    // Extract unique Group entities
    const uniqueGroups = new Map<string, Group>();
    for (const member of groupMembers) {
      if (member.group?.id) {
        uniqueGroups.set(member.group.id, member.group);
      }
    }
    
    return Array.from(uniqueGroups.values());
  }

  async findOne(groupId: string): Promise<Group | null> {
    return this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['owner', 'members', 'members.user'],
    });
  }
}
