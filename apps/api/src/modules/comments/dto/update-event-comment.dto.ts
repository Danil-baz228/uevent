import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateEventCommentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(800)
  content!: string;
}
