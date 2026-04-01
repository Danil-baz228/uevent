import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import { isDatabaseEnabled } from '../../config/database-mode';
import { EventEntity } from '../events/entities/event.entity';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegistrationsService } from '../registrations/registrations.service';
import { UsersService } from '../users/users.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

type ConfirmedRegistrationPayload = Awaited<
  ReturnType<RegistrationsService['confirmStripeRegistration']>
>;

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
    private readonly mailService: MailService,
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
    const wasConfirmed = registration.status === 'confirmed';

    if (this.useMockCheckout) {
      await this.registrationsService.markStripePaymentStatus(
        registration.id,
        'paid',
      );
      const confirmedRegistration = await this.registrationsService.confirmStripeRegistration(
        registration,
        'paid',
      );

      return this.finalizeSuccessfulPayment({
        registration,
        confirmedRegistration,
        attendee,
        userId,
        sessionId,
        wasConfirmed,
      });
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

    return this.finalizeSuccessfulPayment({
      registration,
      confirmedRegistration,
      attendee,
      userId,
      sessionId,
      wasConfirmed,
    });
  }

  private async finalizeSuccessfulPayment(input: {
    registration: {
      id: string;
      quantity: number;
      amountTotal: number;
      ticketAssetPath: string | null;
      paymentReceiptPreviewPath: string | null;
      paymentReceiptMessageId: string | null;
      paymentReceiptSentAt: Date | null;
      event: EventEntity;
    };
    confirmedRegistration: ConfirmedRegistrationPayload;
    attendee: {
      displayName: string;
      email: string;
    };
    userId: string;
    sessionId: string;
    wasConfirmed: boolean;
  }) {
    if (!input.wasConfirmed) {
      await this.notificationsService.notifyPaymentConfirmed(
        input.userId,
        input.registration.event,
      );
      await this.notificationsService.notifyNewAttendee(
        input.registration.event.organizer?.id ??
          input.registration.event.organizerId ??
          null,
        input.registration.event,
        input.attendee.displayName,
        input.userId,
      );
    }

    const alreadyHasArtifacts =
      Boolean(input.registration.ticketAssetPath) &&
      Boolean(input.registration.paymentReceiptPreviewPath) &&
      Boolean(input.registration.paymentReceiptSentAt);

    if (alreadyHasArtifacts) {
      return input.confirmedRegistration;
    }

    try {
      const artifacts = await this.mailService.sendPaymentReceipt({
        attendee: input.attendee,
        event: input.registration.event,
        registrationId: input.registration.id,
        sessionId: input.sessionId,
        quantity: input.confirmedRegistration.quantity,
        amountTotal: input.confirmedRegistration.amountTotal,
        currency: this.currency,
      });

      await this.registrationsService.attachPaymentArtifacts(
        input.registration.id,
        artifacts,
      );

      return {
        ...input.confirmedRegistration,
        ticketAssetPath: artifacts.ticketAssetPath,
        paymentReceiptPreviewPath: artifacts.paymentReceiptPreviewPath,
        paymentReceiptMessageId: artifacts.paymentReceiptMessageId,
        paymentReceiptSentAt: artifacts.paymentReceiptSentAt,
      };
    } catch (error) {
      console.error('Failed to generate payment receipt email', error);
      return input.confirmedRegistration;
    }
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
