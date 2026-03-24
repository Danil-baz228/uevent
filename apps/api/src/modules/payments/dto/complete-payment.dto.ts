import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CompletePaymentDto {
  @IsString()
  eventId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsString()
  cardholderName!: string;

  @IsString()
  cardNumber!: string;

  @IsString()
  expiry!: string;

  @IsString()
  cvc!: string;
}
