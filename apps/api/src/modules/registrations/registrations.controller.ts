import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationReminderDto } from './dto/update-registration-reminder.dto';
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
}
