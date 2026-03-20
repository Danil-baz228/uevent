import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { EventCommentEntity } from '../../comments/entities/event-comment.entity';
import { EventRegistrationEntity } from '../../registrations/entities/event-registration.entity';
import { UserEntity } from '../../users/entities/user.entity';

export type AttendeeVisibility = 'everyone' | 'registered_only' | 'nobody';
export type CommentAccess = 'everyone' | 'registered_only' | 'closed';

@Entity({ name: 'events' })
export class EventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column()
  category!: string;

  @Column({ default: 'Meetup' })
  format!: string;

  @Column({ default: 'Community' })
  theme!: string;

  @Column()
  city!: string;

  @Column({ type: 'varchar', nullable: true })
  posterUrl!: string | null;

  @Column({ type: 'timestamptz' })
  startsAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  publishAt!: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price!: number;

  @Column({ default: 50 })
  capacity!: number;

  @Column({ default: false })
  hideAttendeeNames!: boolean;

  @Column({ default: 'everyone' })
  attendeeVisibility!: AttendeeVisibility;

  @Column({ default: true })
  notifyOnNewAttendee!: boolean;

  @Column({ default: 'everyone' })
  commentAccess!: CommentAccess;

  @Column({ default: false })
  commentsClosed!: boolean;

  @Column({ nullable: true })
  organizerId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => UserEntity, (user) => user.events, { nullable: true })
  @JoinColumn({ name: 'organizerId' })
  organizer!: UserEntity | null;

  @OneToMany(() => EventRegistrationEntity, (registration) => registration.event)
  registrations!: EventRegistrationEntity[];

  @OneToMany(() => EventCommentEntity, (comment) => comment.event)
  comments!: EventCommentEntity[];
}
