import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentType } from '@prisma/client';

export class CreateDepositDto {
  @IsString()
  @IsNotEmpty()
  providerCode!: string;

  @IsEnum(PaymentType)
  paymentType!: PaymentType;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(1_000_000)
  amount!: number;

  @IsString()
  @MinLength(4)
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9-]+$/, {
    message: 'Transaction reference must be alphanumeric',
  })
  transactionReference!: string;
}
