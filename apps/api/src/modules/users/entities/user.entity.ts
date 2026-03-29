import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { EventCommentEntity } from '../../comments/entities/event-comment.entity';
import { CompanyNewsEntity } from '../../companies/entities/company-news.entity';
import { CompanyEntity } from '../../companies/entities/company.entity';
import { EventEntity } from '../../events/entities/event.entity';
import { NotificationEntity } from '../../notifications/entities/notification.entity';
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

  @Column({ type: 'varchar', nullable: true })
  passwordResetToken!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  passwordResetTokenExpiresAt!: Date | null;

  @Column('text', { array: true, default: '{}' })
  interests!: string[];

  @Column('uuid', { array: true, default: '{}' })
  subscribedCompanyIds!: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => EventEntity, (event) => event.organizer)
  events!: EventEntity[];

  @OneToMany(() => CompanyEntity, (company) => company.owner)
  companies!: CompanyEntity[];

  @OneToMany(() => CompanyNewsEntity, (newsItem) => newsItem.author)
  companyNews!: CompanyNewsEntity[];

  @OneToMany(() => EventRegistrationEntity, (registration) => registration.user)
  registrations!: EventRegistrationEntity[];

  @OneToMany(() => EventCommentEntity, (comment) => comment.author)
  comments!: EventCommentEntity[];

  @OneToMany(() => NotificationEntity, (notification) => notification.user)
  notifications!: NotificationEntity[];
}
