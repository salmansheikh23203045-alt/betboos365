import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
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

  /**
   * Optional: the number the money was sent from. Deposits may come from any
   * mobile number, so this is never compared with the registered number; it
   * only helps staff match the payment. Must be a valid Bangladeshi mobile.
   */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  senderPhone?: string;
}
