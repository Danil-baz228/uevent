import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { EventEntity } from '../../events/entities/event.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity({ name: 'event_comments' })
export class EventCommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  eventId!: string;

  @Column()
  authorId!: string;

  @Column({ type: 'uuid', nullable: true })
  parentCommentId!: string | null;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => EventEntity, (event) => event.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event!: EventEntity;

  @ManyToOne(() => UserEntity, (user) => user.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author!: UserEntity;
}
