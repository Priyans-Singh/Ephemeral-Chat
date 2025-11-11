import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Group } from './group.entity';

@Entity('group_messages')
export class GroupMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { eager: true })
  sender: User;

  @ManyToOne(() => Group)
  group: Group;
}
