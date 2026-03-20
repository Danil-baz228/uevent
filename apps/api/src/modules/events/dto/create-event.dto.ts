import {
  Transform,
  Type,
} from 'class-transformer';
import {
  IsIn,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  category!: string;

  @IsString()
  format!: string;

  @IsString()
  theme!: string;

  @IsString()
  city!: string;

  @IsOptional()
  @IsUrl()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() ? value.trim() : undefined))
  posterUrl?: string;

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && !value.trim() ? null : value,
  )
  @IsDateString()
  publishAt?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsIn(['everyone', 'registered_only', 'nobody'])
  attendeeVisibility?: 'everyone' | 'registered_only' | 'nobody';

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  notifyOnNewAttendee?: boolean;

  @IsOptional()
  @IsIn(['everyone', 'registered_only', 'closed'])
  commentAccess?: 'everyone' | 'registered_only' | 'closed';
}
