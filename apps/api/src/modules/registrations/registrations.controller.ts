import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { CheckInTicketDto } from './dto/check-in-ticket.dto';
import { UpdateRegistrationReminderDto } from './dto/update-registration-reminder.dto';
import { VerifyTicketDto } from './dto/verify-ticket.dto';
import { RegistrationsService } from './registrations.service';

@ApiTags('registrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post()
  create(@Body() dto: CreateRegistrationDto, @CurrentUser() user: { sub: string }) {
    return this.registrationsService.createFreeRegistration(dto, user.sub);
  }

  @Get('me')
  findMine(@CurrentUser() user: { sub: string }) {
    return this.registrationsService.findMine(user.sub);
  }

  @Patch(':eventId/reminder')
  updateReminder(
    @Param('eventId') eventId: string,
    @Body() dto: UpdateRegistrationReminderDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.registrationsService.updateReminder(eventId, dto, user.sub);
  }

  @Post('verify-ticket')
  verifyTicket(
    @Body() dto: VerifyTicketDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.registrationsService.verifyTicket(dto.ticketCode, user.sub, dto.eventId);
  }

  @Post('check-in')
  checkInTicket(
    @Body() dto: CheckInTicketDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.registrationsService.checkInTicket(dto.ticketCode, user.sub, dto.eventId);
  }
}
