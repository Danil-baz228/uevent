import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class FindEventsDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsIn(['free', 'paid', 'all'])
  priceType?: 'free' | 'paid' | 'all';

  @IsOptional()
  @IsIn(['date_asc', 'date_desc', 'newest', 'price_asc', 'price_desc'])
  sortBy?: 'date_asc' | 'date_desc' | 'newest' | 'price_asc' | 'price_desc';

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(24)
  limit?: number;
}
