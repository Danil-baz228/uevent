import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

type SendPaymentReceiptInput = {
  attendee: {
    displayName: string;
    email: string;
  };
  event: {
    id: string;
    title: string;
    description: string;
    city: string;
    address: string | null;
    startsAt: Date;
    company?: { name: string } | null;
    organizer?: { displayName: string } | null;
  };
  registrationId: string;
  sessionId: string;
  quantity: number;
  amountTotal: number;
  currency: string;
};

export type PaymentReceiptArtifacts = {
  ticketAssetPath: string;
  paymentReceiptPreviewPath: string;
  paymentReceiptMessageId: string | null;
  paymentReceiptSentAt: Date;
};

@Injectable()
export class MailService {
  private readonly transporter: Transporter;
  private readonly fromAddress: string;
  private readonly uploadsRoot = join(process.cwd(), 'apps', 'api', 'uploads');
  private readonly ticketsDir = join(this.uploadsRoot, 'tickets');
  private readonly mailPreviewDir = join(this.uploadsRoot, 'mail-previews');
  private readonly rawEmailDir = join(this.uploadsRoot, 'mail-raw');

  constructor(private readonly configService: ConfigService) {
    this.fromAddress = this.configService.get<string>(
      'MAIL_FROM',
      'tickets@uevent.local',
    );

    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    const smtpSecure =
      this.configService.get<string>('SMTP_SECURE', 'false') === 'true';

    this.transporter = smtpHost
      ? nodemailer.createTransport({
          host: smtpHost,
          port: Number(this.configService.get<number>('SMTP_PORT', 587)),
          secure: smtpSecure,
          auth:
            smtpUser && smtpPass
              ? {
                  user: smtpUser,
                  pass: smtpPass,
                }
              : undefined,
        })
      : nodemailer.createTransport({
          streamTransport: true,
          buffer: true,
          newline: 'unix',
        });
  }

  async sendPaymentReceipt(
    input: SendPaymentReceiptInput,
  ): Promise<PaymentReceiptArtifacts> {
    await this.ensureOutputDirectories();

    const sentAt = new Date();
    const ticketCode = this.buildTicketCode(input.event.id, input.registrationId);
    const ticketFileName = `${ticketCode}.html`;
    const previewFileName = `${ticketCode}-receipt.html`;
    const rawEmailFileName = `${ticketCode}.eml`;
    const ticketAssetPath = `/uploads/tickets/${ticketFileName}`;
    const paymentReceiptPreviewPath = `/uploads/mail-previews/${previewFileName}`;
    const ticketFilePath = join(this.ticketsDir, ticketFileName);
    const previewFilePath = join(this.mailPreviewDir, previewFileName);
    const rawEmailFilePath = join(this.rawEmailDir, rawEmailFileName);
    const organizerName =
      input.event.company?.name ??
      input.event.organizer?.displayName ??
      'Uevent Organizer';
    const formattedAmount = this.formatMoney(input.amountTotal, input.currency);
    const formattedDate = this.formatDate(input.event.startsAt);
    const subject = `Payment confirmed: ${input.event.title}`;
    const ticketLink = `../tickets/${ticketFileName}`;
    const ticketHtml = this.renderTicketHtml({
      attendeeName: input.attendee.displayName,
      ticketCode,
      eventTitle: input.event.title,
      organizerName,
      city: input.event.city,
      address: input.event.address,
      startsAt: formattedDate,
      quantity: input.quantity,
      amount: formattedAmount,
      sessionId: input.sessionId,
      generatedAt: this.formatDate(sentAt),
    });
    const emailHtml = this.renderEmailHtml({
      attendeeName: input.attendee.displayName,
      email: input.attendee.email,
      eventTitle: input.event.title,
      organizerName,
      startsAt: formattedDate,
      city: input.event.city,
      address: input.event.address,
      quantity: input.quantity,
      amount: formattedAmount,
      sessionId: input.sessionId,
      ticketCode,
      ticketLink,
    });
    const emailText = this.renderEmailText({
      attendeeName: input.attendee.displayName,
      eventTitle: input.event.title,
      organizerName,
      startsAt: formattedDate,
      city: input.event.city,
      address: input.event.address,
      quantity: input.quantity,
      amount: formattedAmount,
      ticketCode,
      ticketUrl: ticketAssetPath,
    });

    await writeFile(ticketFilePath, ticketHtml, 'utf8');
    await writeFile(previewFilePath, emailHtml, 'utf8');

    const info = await this.transporter.sendMail({
      from: this.fromAddress,
      to: input.attendee.email,
      subject,
      text: emailText,
      html: emailHtml,
      attachments: [
        {
          filename: `uevent-ticket-${ticketCode}.html`,
          path: ticketFilePath,
          contentType: 'text/html; charset=utf-8',
        },
      ],
    });

    if (Buffer.isBuffer(info.message)) {
      await writeFile(rawEmailFilePath, info.message);
    }

    return {
      ticketAssetPath,
      paymentReceiptPreviewPath,
      paymentReceiptMessageId:
        typeof info.messageId === 'string' ? info.messageId : null,
      paymentReceiptSentAt: sentAt,
    };
  }

  private async ensureOutputDirectories() {
    await Promise.all([
      mkdir(this.ticketsDir, { recursive: true }),
      mkdir(this.mailPreviewDir, { recursive: true }),
      mkdir(this.rawEmailDir, { recursive: true }),
    ]);
  }

  private buildTicketCode(eventId: string, registrationId: string) {
    const eventPart = eventId.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(-6);
    const registrationPart = registrationId
      .replace(/[^a-z0-9]/gi, '')
      .toUpperCase()
      .slice(-8);

    return `UE-${eventPart}-${registrationPart}`;
  }

  private renderTicketHtml(input: {
    attendeeName: string;
    ticketCode: string;
    eventTitle: string;
    organizerName: string;
    city: string;
    address: string | null;
    startsAt: string;
    quantity: number;
    amount: string;
    sessionId: string;
    generatedAt: string;
  }) {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Uevent Ticket</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #132033;
        --muted: #5a6881;
        --line: rgba(19, 32, 51, 0.12);
        --card: #ffffff;
        --panel: linear-gradient(135deg, #fef2d7, #f3f8ff 52%, #daf4ee 100%);
        --accent: #d45a2b;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Segoe UI", sans-serif;
        background: #f4f6fb;
        color: var(--ink);
        padding: 32px;
      }
      .ticket {
        max-width: 880px;
        margin: 0 auto;
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 28px;
        overflow: hidden;
        box-shadow: 0 24px 80px rgba(30, 55, 90, 0.12);
      }
      .hero {
        padding: 32px;
        background: var(--panel);
        border-bottom: 1px solid var(--line);
      }
      .eyebrow {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.76);
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--accent);
        font-weight: 700;
      }
      h1 {
        margin: 16px 0 12px;
        font-size: 36px;
        line-height: 1.05;
      }
      p {
        margin: 0;
        color: var(--muted);
        line-height: 1.6;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
        padding: 32px;
      }
      .cell {
        border: 1px solid var(--line);
        border-radius: 20px;
        padding: 18px;
        background: rgba(245, 248, 255, 0.68);
      }
      .label {
        display: block;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
        margin-bottom: 8px;
      }
      .value {
        font-size: 18px;
        font-weight: 700;
        color: var(--ink);
      }
      .footer {
        padding: 0 32px 32px;
      }
      .code {
        display: inline-flex;
        padding: 12px 16px;
        border-radius: 16px;
        background: #132033;
        color: #f7fbff;
        font-weight: 800;
        letter-spacing: 0.08em;
      }
      @media (max-width: 720px) {
        body { padding: 16px; }
        .grid { grid-template-columns: 1fr; padding: 20px; }
        .hero { padding: 24px; }
        .footer { padding: 0 20px 20px; }
      }
    </style>
  </head>
  <body>
    <section class="ticket">
      <header class="hero">
        <span class="eyebrow">Uevent ticket</span>
        <h1>${this.escapeHtml(input.eventTitle)}</h1>
        <p>
          This ticket confirms paid access for ${this.escapeHtml(input.attendeeName)}.
          Keep the code below and present it at check-in if the organizer asks.
        </p>
      </header>
      <div class="grid">
        <article class="cell">
          <span class="label">Organizer</span>
          <span class="value">${this.escapeHtml(input.organizerName)}</span>
        </article>
        <article class="cell">
          <span class="label">Starts at</span>
          <span class="value">${this.escapeHtml(input.startsAt)}</span>
        </article>
        <article class="cell">
          <span class="label">City</span>
          <span class="value">${this.escapeHtml(input.city)}</span>
        </article>
        <article class="cell">
          <span class="label">Address</span>
          <span class="value">${this.escapeHtml(input.address ?? 'To be announced')}</span>
        </article>
        <article class="cell">
          <span class="label">Quantity</span>
          <span class="value">${input.quantity}</span>
        </article>
        <article class="cell">
          <span class="label">Paid</span>
          <span class="value">${this.escapeHtml(input.amount)}</span>
        </article>
      </div>
      <footer class="footer">
        <p><span class="label">Ticket code</span></p>
        <p class="code">${this.escapeHtml(input.ticketCode)}</p>
        <p style="margin-top: 18px;">
          Checkout session: ${this.escapeHtml(input.sessionId)}<br />
          Generated at: ${this.escapeHtml(input.generatedAt)}
        </p>
      </footer>
    </section>
  </body>
</html>`;
  }

  private renderEmailHtml(input: {
    attendeeName: string;
    email: string;
    eventTitle: string;
    organizerName: string;
    startsAt: string;
    city: string;
    address: string | null;
    quantity: number;
    amount: string;
    sessionId: string;
    ticketCode: string;
    ticketLink: string;
  }) {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Payment receipt</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #132033;
        --muted: #607089;
        --card: #ffffff;
        --line: rgba(19, 32, 51, 0.12);
        --bg: #eef2f8;
        --accent: #d45a2b;
        --accent-soft: rgba(212, 90, 43, 0.1);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--ink);
        font-family: "Segoe UI", sans-serif;
        padding: 24px;
      }
      .shell {
        max-width: 760px;
        margin: 0 auto;
        border-radius: 28px;
        overflow: hidden;
        border: 1px solid var(--line);
        background: var(--card);
        box-shadow: 0 24px 80px rgba(30, 55, 90, 0.12);
      }
      .masthead {
        padding: 32px;
        background: linear-gradient(135deg, #132033 0%, #1c3155 58%, #28537a 100%);
        color: #f7fbff;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        border-radius: 999px;
        background: rgba(247, 251, 255, 0.14);
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-weight: 700;
      }
      h1 {
        margin: 16px 0 10px;
        font-size: 34px;
        line-height: 1.05;
      }
      p {
        margin: 0;
        color: inherit;
        line-height: 1.7;
      }
      .body {
        padding: 32px;
      }
      .mail-meta {
        display: grid;
        gap: 10px;
        padding: 18px;
        border: 1px solid var(--line);
        border-radius: 20px;
        background: #f8fbff;
        margin-bottom: 24px;
      }
      .meta-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      .meta-row span:first-child {
        color: var(--muted);
      }
      .summary {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
        margin: 24px 0;
      }
      .summary-card {
        border: 1px solid var(--line);
        border-radius: 20px;
        padding: 18px;
        background: linear-gradient(180deg, rgba(212, 90, 43, 0.08), rgba(255, 255, 255, 0.9));
      }
      .summary-card strong {
        display: block;
        margin-top: 8px;
        font-size: 18px;
      }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-top: 8px;
        padding: 14px 18px;
        border-radius: 16px;
        background: #132033;
        color: #f7fbff;
        text-decoration: none;
        font-weight: 700;
      }
      .note {
        margin-top: 20px;
        padding: 16px 18px;
        border-radius: 18px;
        background: var(--accent-soft);
        color: var(--ink);
      }
      @media (max-width: 720px) {
        body { padding: 12px; }
        .masthead, .body { padding: 22px; }
        .summary { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <section class="shell">
      <header class="masthead">
        <span class="pill">Payment receipt</span>
        <h1>${this.escapeHtml(input.eventTitle)}</h1>
        <p>
          Hi ${this.escapeHtml(input.attendeeName)}, your card payment was captured successfully.
          Your generated ticket is attached to this email and also available with the button below.
        </p>
      </header>
      <div class="body">
        <div class="mail-meta">
          <div class="meta-row"><span>To</span><strong>${this.escapeHtml(input.email)}</strong></div>
          <div class="meta-row"><span>Organizer</span><strong>${this.escapeHtml(input.organizerName)}</strong></div>
          <div class="meta-row"><span>Session</span><strong>${this.escapeHtml(input.sessionId)}</strong></div>
          <div class="meta-row"><span>Ticket code</span><strong>${this.escapeHtml(input.ticketCode)}</strong></div>
        </div>

        <p>
          We confirmed ${input.quantity} paid ticket(s) for <strong>${this.escapeHtml(input.eventTitle)}</strong>.
          Keep this email for your records or open the generated ticket below.
        </p>

        <div class="summary">
          <article class="summary-card">
            <span>Date and time</span>
            <strong>${this.escapeHtml(input.startsAt)}</strong>
          </article>
          <article class="summary-card">
            <span>Location</span>
            <strong>${this.escapeHtml(
              input.address ? `${input.city}, ${input.address}` : input.city,
            )}</strong>
          </article>
          <article class="summary-card">
            <span>Paid amount</span>
            <strong>${this.escapeHtml(input.amount)}</strong>
          </article>
          <article class="summary-card">
            <span>Quantity</span>
            <strong>${input.quantity}</strong>
          </article>
        </div>

        <a class="button" href="${this.escapeHtml(input.ticketLink)}" target="_blank" rel="noreferrer">
          Open generated ticket
        </a>

        <div class="note">
          This preview is stored locally by the backend as a demo mailbox so the payment flow can be
          shown even without a real SMTP provider configured.
        </div>
      </div>
    </section>
  </body>
</html>`;
  }

  private renderEmailText(input: {
    attendeeName: string;
    eventTitle: string;
    organizerName: string;
    startsAt: string;
    city: string;
    address: string | null;
    quantity: number;
    amount: string;
    ticketCode: string;
    ticketUrl: string;
  }) {
    return [
      `Hello ${input.attendeeName},`,
      '',
      `Your payment for "${input.eventTitle}" was confirmed.`,
      `Organizer: ${input.organizerName}`,
      `Starts at: ${input.startsAt}`,
      `Location: ${input.address ? `${input.city}, ${input.address}` : input.city}`,
      `Quantity: ${input.quantity}`,
      `Paid amount: ${input.amount}`,
      `Ticket code: ${input.ticketCode}`,
      '',
      `Generated ticket: ${input.ticketUrl}`,
      '',
      'Thank you for using Uevent.',
    ].join('\n');
  }

  private formatMoney(amount: number, currency: string) {
    const normalizedCurrency = currency.toUpperCase();

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: normalizedCurrency,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${normalizedCurrency}`;
    }
  }

  private formatDate(value: Date) {
    return new Intl.DateTimeFormat('uk-UA', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(value);
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
