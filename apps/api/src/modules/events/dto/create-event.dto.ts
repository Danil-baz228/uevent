import {
  plainToInstance,
  Transform,
  Type,
} from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';

export class EventPromoCodeDto {
  @IsString()
  code!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  discountPercent!: number;
}

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
  @IsString()
  address?: string;

  @IsString()
  companyId!: string;

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
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || null : value,
  )
  @IsString()
  redirectAfterPurchaseUrl?: string | null;

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

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)
          ? plainToInstance(EventPromoCodeDto, parsed)
          : parsed;
      } catch {
        return value;
      }
    }

    if (Array.isArray(value)) {
      return plainToInstance(EventPromoCodeDto, value);
    }

    return value;
  })
  @IsArray()
  @Type(() => EventPromoCodeDto)
  @ValidateNested({ each: true })
  @ArrayMaxSize(20)
  promoCodes?: EventPromoCodeDto[];
}
