import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class UpdateRegistrationReminderDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && !value.trim() ? null : value,
  )
  @IsDateString()
  reminderAt?: string | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return value;
  })
  @IsBoolean()
  showAttendeeName?: boolean;
}
