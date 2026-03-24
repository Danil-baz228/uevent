import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';
import { CompanyEntity } from './company.entity';

@Entity({ name: 'company_news' })
export class CompanyNewsEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  companyId!: string;

  @Column()
  authorId!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => CompanyEntity, (company) => company.news, { nullable: false })
  @JoinColumn({ name: 'companyId' })
  company!: CompanyEntity;

  @ManyToOne(() => UserEntity, (user) => user.companyNews, { nullable: false })
  @JoinColumn({ name: 'authorId' })
  author!: UserEntity;
}
