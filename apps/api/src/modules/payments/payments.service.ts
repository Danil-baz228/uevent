import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { Repository } from 'typeorm';

import { EventEntity } from '../events/entities/event.entity';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly currency: string;
  private readonly successUrl: string;
  private readonly cancelUrl: string;

  constructor(
    @InjectRepository(EventEntity)
    private readonly eventsRepository: Repository<EventEntity>,
    private readonly configService: ConfigService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!secretKey) {
      throw new Error('Missing STRIPE_SECRET_KEY');
    }

    this.stripe = new Stripe(secretKey);
    this.currency = this.configService.get<string>('STRIPE_CURRENCY', 'usd');
    this.successUrl = this.configService.get<string>(
      'STRIPE_SUCCESS_URL',
      'http://localhost:5173/payment/success?session_id={CHECKOUT_SESSION_ID}',
    );
    this.cancelUrl = this.configService.get<string>(
      'STRIPE_CANCEL_URL',
      'http://localhost:5173/payment/cancel',
    );
  }

  async createCheckoutSession(dto: CreateCheckoutSessionDto) {
    const event = await this.eventsRepository.findOne({
      where: { id: dto.eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event ${dto.eventId} was not found`);
    }

    const amount = Number(event.price);

    if (amount <= 0) {
      throw new BadRequestException(
        'This event is free and does not require Stripe checkout',
      );
    }

    const quantity = dto.quantity ?? 1;
    const unitAmount = Math.round(amount * 100);
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: this.successUrl,
      cancel_url: this.cancelUrl,
      line_items: [
        {
          quantity,
          price_data: {
            currency: this.currency,
            unit_amount: unitAmount,
            product_data: {
              name: event.title,
              description: event.description.slice(0, 500),
            },
          },
        },
      ],
      metadata: {
        eventId: event.id,
        quantity: String(quantity),
      },
    });

    return {
      provider: 'stripe',
      status: session.payment_status,
      sessionId: session.id,
      url: session.url,
      amount: unitAmount,
      currency: this.currency,
      eventId: event.id,
      eventTitle: event.title,
      quantity,
    };
  }
}
