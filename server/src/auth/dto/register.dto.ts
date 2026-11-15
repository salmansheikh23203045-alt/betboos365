import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsBoolean,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message:
      'Username may only contain letters, digits, dots, underscores, and hyphens',
  })
  username!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one digit',
  })
  password!: string;

  // Bangladeshi mobile number, required: it becomes the account's registered
  // number, the only number withdrawals can be paid to once verified.
  @IsString()
  @Matches(/^(?:\+?880|0)?1[3-9]\d{8}$/, {
    message: 'Enter a valid Bangladeshi mobile number',
  })
  phone!: string;

  @IsBoolean()
  acceptTerms!: boolean;
}
