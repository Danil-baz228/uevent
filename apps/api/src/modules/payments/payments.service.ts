import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import { isDatabaseEnabled } from '../../config/database-mode';
import { RegistrationsService } from '../registrations/registrations.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe | null;
  private readonly currency: string;
  private readonly successUrl: string;
  private readonly cancelUrl: string;
  private readonly useMockCheckout: boolean;

  constructor(
    private readonly registrationsService: RegistrationsService,
    private readonly configService: ConfigService,
  ) {
    this.useMockCheckout = !isDatabaseEnabled;
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!secretKey && !this.useMockCheckout) {
      throw new Error('Missing STRIPE_SECRET_KEY');
    }

    this.stripe =
      this.useMockCheckout || !secretKey ? null : new Stripe(secretKey);
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

  async createCheckoutSession(dto: CreateCheckoutSessionDto, userId: string) {
    const quantity = dto.quantity ?? 1;
    const { registration, event } =
      await this.registrationsService.createPendingStripeRegistration(
        dto.eventId,
        userId,
        quantity,
      );
    const amount = Number(event.price);
    const unitAmount = Math.round(amount * 100);

    if (this.useMockCheckout) {
      const sessionId = `cs_test_${randomUUID().replace(/-/g, '')}`;
      const url = this.successUrl.replace('{CHECKOUT_SESSION_ID}', sessionId);

      await this.registrationsService.attachCheckoutSession(
        registration.id,
        sessionId,
        'unpaid',
      );

      return {
        provider: 'stripe',
        status: 'unpaid',
        registrationId: registration.id,
        sessionId,
        url,
        amount: unitAmount,
        currency: this.currency,
        eventId: event.id,
        eventTitle: event.title,
        quantity,
      };
    }

    if (!this.stripe) {
      throw new Error('Stripe client is not initialized');
    }

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
        registrationId: registration.id,
        userId,
        quantity: String(quantity),
      },
    });

    await this.registrationsService.attachCheckoutSession(
      registration.id,
      session.id,
      session.payment_status,
    );

    return {
      provider: 'stripe',
      status: session.payment_status,
      registrationId: registration.id,
      sessionId: session.id,
      url: session.url,
      amount: unitAmount,
      currency: this.currency,
      eventId: event.id,
      eventTitle: event.title,
      quantity,
    };
  }

  async confirmCheckoutSession(sessionId: string, userId: string) {
    const registration = await this.registrationsService.findOneBySessionId(
      sessionId,
      userId,
    );

    if (this.useMockCheckout) {
      await this.registrationsService.markStripePaymentStatus(
        registration.id,
        'paid',
      );

      return this.registrationsService.confirmStripeRegistration(
        registration,
        'paid',
      );
    }

    if (!this.stripe) {
      throw new Error('Stripe client is not initialized');
    }

    const session = await this.stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      throw new NotFoundException(`Stripe checkout session ${sessionId} was not found`);
    }

    await this.registrationsService.markStripePaymentStatus(
      registration.id,
      session.payment_status,
    );

    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Payment is not completed yet');
    }

    return this.registrationsService.confirmStripeRegistration(
      registration,
      session.payment_status,
    );
  }
}
