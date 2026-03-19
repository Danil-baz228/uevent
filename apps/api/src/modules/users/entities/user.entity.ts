import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { EventCommentEntity } from '../../comments/entities/event-comment.entity';
import { EventEntity } from '../../events/entities/event.entity';
import { EventRegistrationEntity } from '../../registrations/entities/event-registration.entity';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  displayName!: string;

  @Column()
  passwordHash!: string;

  @Column({ type: 'varchar', nullable: true })
  refreshTokenHash!: string | null;

  @Column('text', { array: true, default: '{}' })
  interests!: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => EventEntity, (event) => event.organizer)
  events!: EventEntity[];

  @OneToMany(() => EventRegistrationEntity, (registration) => registration.user)
  registrations!: EventRegistrationEntity[];

  @OneToMany(() => EventCommentEntity, (comment) => comment.author)
  comments!: EventCommentEntity[];
}
