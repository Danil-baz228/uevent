import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import { isDatabaseEnabled } from '../../config/database-mode';
import { NotificationsService } from '../notifications/notifications.service';
import { RegistrationsService } from '../registrations/registrations.service';
import { UsersService } from '../users/users.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CompletePaymentDto } from './dto/complete-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe | null;
  private readonly currency: string;
  private readonly successUrl: string;
  private readonly cancelUrl: string;
  private readonly useMockCheckout: boolean;

  constructor(
    private readonly registrationsService: RegistrationsService,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
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
    const event = await this.registrationsService.findEventForCheckout(dto.eventId);
    const promo = this.resolvePromo(event, dto.promoCode);
    const amount = Number(event.price);
    const discountedAmount = Number(
      (amount * (1 - (promo?.discountPercent ?? 0) / 100)).toFixed(2),
    );
    const finalAmount = discountedAmount * quantity;
    const unitAmount = Math.round(discountedAmount * 100);
    const { registration } =
      await this.registrationsService.createPendingStripeRegistration(
        dto.eventId,
        userId,
        quantity,
        finalAmount,
      );

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
        originalAmount: Math.round(amount * 100),
        discountPercent: promo?.discountPercent ?? 0,
        promoCode: promo?.code ?? null,
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
      originalAmount: Math.round(amount * 100),
      discountPercent: promo?.discountPercent ?? 0,
      promoCode: promo?.code ?? null,
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
    const attendee = await this.usersService.getCurrentUser(userId);

    if (this.useMockCheckout) {
      await this.registrationsService.markStripePaymentStatus(
        registration.id,
        'paid',
      );
      const confirmedRegistration = await this.registrationsService.confirmStripeRegistration(
        registration,
        'paid',
      );
      await this.notificationsService.notifyPaymentConfirmed(
        userId,
        registration.event,
      );
      await this.notificationsService.notifyNewAttendee(
        registration.event.organizer?.id ?? registration.event.organizerId ?? null,
        registration.event,
        attendee.displayName,
        userId,
      );
      return confirmedRegistration;
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

    const confirmedRegistration = await this.registrationsService.confirmStripeRegistration(
      registration,
      session.payment_status,
    );
    await this.notificationsService.notifyPaymentConfirmed(userId, registration.event);
    await this.notificationsService.notifyNewAttendee(
      registration.event.organizer?.id ?? registration.event.organizerId ?? null,
      registration.event,
      attendee.displayName,
      userId,
    );
    return confirmedRegistration;
  }

  async completePayment(dto: CompletePaymentDto, userId: string) {
    const quantity = dto.quantity ?? 1;
    const event = await this.registrationsService.findEventForCheckout(dto.eventId);
    const promo = this.resolvePromo(event, dto.promoCode);
    const amount = Number(event.price);
    const discountedAmount = Number(
      (amount * (1 - (promo?.discountPercent ?? 0) / 100)).toFixed(2),
    );
    const finalAmount = discountedAmount * quantity;
    const cardNumber = dto.cardNumber.replace(/\s+/g, '');
    const expiry = dto.expiry.trim();
    const cvc = dto.cvc.trim();
    const cardholderName = dto.cardholderName.trim();

    if (!cardholderName) {
      throw new BadRequestException('Cardholder name is required');
    }

    if (!/^\d{16}$/.test(cardNumber)) {
      throw new BadRequestException('Card number must contain 16 digits');
    }

    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      throw new BadRequestException('Expiry must be in MM/YY format');
    }

    const [expiryMonth] = expiry.split('/').map((value) => Number(value));

    if (!expiryMonth || expiryMonth < 1 || expiryMonth > 12) {
      throw new BadRequestException('Expiry month must be between 01 and 12');
    }

    if (!/^\d{3,4}$/.test(cvc)) {
      throw new BadRequestException('CVC must contain 3 or 4 digits');
    }

    const sessionId = `embedded_${randomUUID().replace(/-/g, '')}`;
    const attendee = await this.usersService.getCurrentUser(userId);
    const { registration } =
      await this.registrationsService.createPendingStripeRegistration(
        dto.eventId,
        userId,
        quantity,
        finalAmount,
      );

    await this.registrationsService.attachCheckoutSession(
      registration.id,
      sessionId,
      'paid',
    );
    await this.registrationsService.markStripePaymentStatus(
      registration.id,
      'paid',
    );

    const confirmedRegistration = await this.registrationsService.confirmStripeRegistration(
      registration,
      'paid',
    );

    await this.notificationsService.notifyPaymentConfirmed(userId, registration.event);
    await this.notificationsService.notifyNewAttendee(
      registration.event.organizer?.id ?? registration.event.organizerId ?? null,
      registration.event,
      attendee.displayName,
      userId,
    );

    return {
      registration: confirmedRegistration,
      redirectUrl: event.redirectAfterPurchaseUrl ?? '/account',
      amount: Math.round(finalAmount * 100),
      originalAmount: Math.round(amount * quantity * 100),
      discountPercent: promo?.discountPercent ?? 0,
      promoCode: promo?.code ?? null,
      eventId: event.id,
      eventTitle: event.title,
      sessionId,
      status: 'paid',
    };
  }

  private resolvePromo(
    event: { promoCodes?: Array<{ code: string; discountPercent: number }> | null },
    promoCode?: string,
  ) {
    const normalized = promoCode?.trim().toUpperCase();

    if (!normalized) {
      return null;
    }

    const promo = (event.promoCodes ?? []).find((item) => item.code === normalized);

    if (!promo) {
      throw new BadRequestException('Promo code is invalid');
    }

    return promo;
  }
}
