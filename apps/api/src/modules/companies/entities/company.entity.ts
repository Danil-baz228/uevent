import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { EventEntity } from '../../events/entities/event.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { CompanyNewsEntity } from './company-news.entity';

@Entity({ name: 'companies' })
export class CompanyEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column()
  location!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column()
  ownerId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => UserEntity, (user) => user.companies, { nullable: false })
  @JoinColumn({ name: 'ownerId' })
  owner!: UserEntity;

  @OneToMany(() => EventEntity, (event) => event.company)
  events!: EventEntity[];

  @OneToMany(() => CompanyNewsEntity, (newsItem) => newsItem.company)
  news!: CompanyNewsEntity[];
}
