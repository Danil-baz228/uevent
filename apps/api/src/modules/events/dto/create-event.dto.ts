import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateEventDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  category!: string;

  @IsString()
  city!: string;

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;
}
