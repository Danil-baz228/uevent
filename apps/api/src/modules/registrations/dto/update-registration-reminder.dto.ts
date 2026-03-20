import { Transform } from 'class-transformer';
import { IsDateString, IsOptional } from 'class-validator';

export class UpdateRegistrationReminderDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && !value.trim() ? null : value,
  )
  @IsDateString()
  reminderAt?: string | null;
}
