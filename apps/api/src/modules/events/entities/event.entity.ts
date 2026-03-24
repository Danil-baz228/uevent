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
import { CompanyEntity } from '../../companies/entities/company.entity';
import { EventRegistrationEntity } from '../../registrations/entities/event-registration.entity';
import { UserEntity } from '../../users/entities/user.entity';

export type AttendeeVisibility = 'everyone' | 'registered_only' | 'nobody';
export type CommentAccess = 'everyone' | 'registered_only' | 'closed';
export type EventPromoCode = {
  code: string;
  discountPercent: number;
};

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
  address!: string | null;

  @Column({ type: 'varchar', nullable: true })
  posterUrl!: string | null;

  @Column({ type: 'timestamptz' })
  startsAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  publishAt!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  redirectAfterPurchaseUrl!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price!: number;

  @Column({ type: 'simple-json', nullable: true })
  promoCodes!: EventPromoCode[] | null;

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

  @Column({ nullable: true })
  companyId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => UserEntity, (user) => user.events, { nullable: true })
  @JoinColumn({ name: 'organizerId' })
  organizer!: UserEntity | null;

  @ManyToOne(() => CompanyEntity, (company) => company.events, { nullable: true })
  @JoinColumn({ name: 'companyId' })
  company!: CompanyEntity | null;

  @OneToMany(() => EventRegistrationEntity, (registration) => registration.event)
  registrations!: EventRegistrationEntity[];

  @OneToMany(() => EventCommentEntity, (comment) => comment.event)
  comments!: EventCommentEntity[];
}
