import { IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsString()
  // Same rule as sign-up: a Bangladeshi mobile number in local (01…) or
  // international (+8801…) form. It is where withdrawals are paid.
  @Matches(/^(?:\+?880|0)?1[3-9]\d{8}$/, { message: 'Enter a valid Bangladeshi mobile number' })
  phone?: string;
}
