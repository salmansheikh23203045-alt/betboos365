import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminDecisionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNote?: string;
}

export class CompleteWithdrawalDto extends AdminDecisionDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  payoutReference?: string;
}
