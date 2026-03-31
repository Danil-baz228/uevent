import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class VerifyTicketDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  ticketCode!: string;

  @IsOptional()
  @IsUUID()
  eventId?: string;
}
