import {
  Transform,
  Type,
} from 'class-transformer';
import {
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
  city!: string;

  @IsOptional()
  @IsUrl()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() ? value.trim() : undefined))
  posterUrl?: string;

  @IsDateString()
  startsAt!: string;

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
}
