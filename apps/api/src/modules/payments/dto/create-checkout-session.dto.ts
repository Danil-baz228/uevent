import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsString()
  eventId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}
