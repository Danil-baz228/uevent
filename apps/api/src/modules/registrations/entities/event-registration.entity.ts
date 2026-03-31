import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { EventEntity } from '../../events/entities/event.entity';
import { UserEntity } from '../../users/entities/user.entity';

export type RegistrationStatus = 'pending_payment' | 'confirmed';
export type PaymentProvider = 'free' | 'stripe';

@Entity({ name: 'event_registrations' })
@Unique(['eventId', 'userId'])
export class EventRegistrationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  eventId!: string;

  @Column()
  userId!: string;

  @Column({ type: 'varchar', length: 32 })
  status!: RegistrationStatus;

  @Column({ type: 'varchar', length: 32 })
  paymentProvider!: PaymentProvider;

  @Column({ default: 1 })
  quantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountTotal!: number;

  @Column({ type: 'varchar', nullable: true })
  stripeCheckoutSessionId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  stripePaymentStatus!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reminderAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  reminderSentAt!: Date | null;

  @Column({ type: 'boolean', default: true })
  showAttendeeName!: boolean;

  @Column({ type: 'varchar', nullable: true })
  ticketAssetPath!: string | null;

  @Column({ type: 'varchar', nullable: true })
  paymentReceiptPreviewPath!: string | null;

  @Column({ type: 'varchar', nullable: true })
  paymentReceiptMessageId!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  paymentReceiptSentAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  checkedInAt!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  checkedInByUserId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => EventEntity, (event) => event.registrations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'eventId' })
  event!: EventEntity;

  @ManyToOne(() => UserEntity, (user) => user.registrations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;
}
