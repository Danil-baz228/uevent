import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(120)
  location!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
