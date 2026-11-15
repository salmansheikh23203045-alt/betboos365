import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWithdrawalDto {
  @IsString()
  @IsNotEmpty()
  providerCode!: string;

  // Not used to choose the payout number: withdrawals always go to the
  // account's verified registered phone. Accepted only so that a client which
  // sends a number gets an explicit error when it is not the registered one.
  @IsOptional()
  @IsString()
  @MaxLength(20)
  receivingPhone?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(1_000_000)
  amount!: number;
}
