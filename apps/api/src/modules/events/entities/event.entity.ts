import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { EventRegistrationEntity } from '../../registrations/entities/event-registration.entity';
import { UserEntity } from '../../users/entities/user.entity';

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

  @Column()
  city!: string;

  @Column({ type: 'timestamptz' })
  startsAt!: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price!: number;

  @Column({ default: 50 })
  capacity!: number;

  @Column({ nullable: true })
  organizerId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => UserEntity, (user) => user.events, { nullable: true })
  @JoinColumn({ name: 'organizerId' })
  organizer!: UserEntity | null;

  @OneToMany(() => EventRegistrationEntity, (registration) => registration.event)
  registrations!: EventRegistrationEntity[];
}
