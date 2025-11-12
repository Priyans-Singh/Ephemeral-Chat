import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from './user.entity';
// No longer need to import CreateUserDto here

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (!ids?.length) {
      return [];
    }
    return this.usersRepository.find({ where: { id: In(ids) } });
  }

  // FIX: Change the parameter type to be more flexible
  async create(userData: Partial<User>): Promise<User> {
    const newUser = this.usersRepository.create(userData);
    return this.usersRepository.save(newUser);
  }
}
