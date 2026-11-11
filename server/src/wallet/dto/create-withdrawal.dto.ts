import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWithdrawalDto {
  @IsString()
  @IsNotEmpty()
  providerCode!: string;

  // Bangladeshi mobile number: optional +880 or leading 0, then 1[3-9] + 8 digits.
  @IsString()
  @Matches(/^(?:\+?8801|01)[3-9]\d{8}$/, {
    message: 'Enter a valid Bangladeshi mobile number',
  })
  receivingPhone!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(1_000_000)
  amount!: number;
}
