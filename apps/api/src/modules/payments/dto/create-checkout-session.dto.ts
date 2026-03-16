import { IsNumber, IsString, Min } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsString()
  eventId!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  currency!: string;
}
