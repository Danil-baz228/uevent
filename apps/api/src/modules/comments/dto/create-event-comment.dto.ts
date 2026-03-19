import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateEventCommentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(800)
  content!: string;

  @IsOptional()
  @IsString()
  parentCommentId?: string;
}
