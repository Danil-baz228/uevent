import { IsString, MaxLength } from 'class-validator';

export class CreateCompanyNewsDto {
  @IsString()
  @MaxLength(140)
  title!: string;

  @IsString()
  @MaxLength(2000)
  content!: string;
}
