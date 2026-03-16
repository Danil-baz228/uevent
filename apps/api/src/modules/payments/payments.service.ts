import { Injectable } from '@nestjs/common';

import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@Injectable()
export class PaymentsService {
  createCheckoutSession(dto: CreateCheckoutSessionDto) {
    return {
      provider: 'stripe',
      status: 'stubbed',
      sessionId: `cs_demo_${dto.eventId}`,
      amount: dto.amount,
      currency: dto.currency,
      message: 'Stripe integration will be connected in the next milestone',
    };
  }
}
