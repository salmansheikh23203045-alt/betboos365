import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message:
      'Username may only contain letters, digits, dots, underscores, and hyphens',
  })
  username!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
