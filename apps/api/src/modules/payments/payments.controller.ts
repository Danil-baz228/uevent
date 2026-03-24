import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { PaymentsService } from './payments.service';
import { ConfirmCheckoutSessionDto } from './dto/confirm-checkout-session.dto';
import { CompletePaymentDto } from './dto/complete-payment.dto';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout-session')
  createCheckoutSession(@Body() dto: CreateCheckoutSessionDto, @CurrentUser() user: { sub: string }) {
    return this.paymentsService.createCheckoutSession(dto, user.sub);
  }

  @Post('confirm-session')
  confirmCheckoutSession(
    @Body() dto: ConfirmCheckoutSessionDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.paymentsService.confirmCheckoutSession(dto.sessionId, user.sub);
  }

  @Post('complete')
  completePayment(@Body() dto: CompletePaymentDto, @CurrentUser() user: { sub: string }) {
    return this.paymentsService.completePayment(dto, user.sub);
  }
}
