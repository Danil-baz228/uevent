import { IsInt, IsString, Min } from 'class-validator';

export class CreateRegistrationDto {
  @IsString()
  eventId!: string;

  @IsInt()
  @Min(1)
  quantity = 1;
}
