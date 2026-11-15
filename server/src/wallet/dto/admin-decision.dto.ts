import { IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';

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
  @Matches(/^[A-Za-z0-9-]*$/, { message: 'Payout reference must be alphanumeric' })
  payoutReference?: string;
}

export class AssignWithdrawalDto {
  /** Agent to hand the payout to; null takes it back from the current agent. */
  @ValidateIf((o) => o.agentId !== null)
  @IsUUID()
  agentId!: string | null;
}

export class ReturnWithdrawalDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  note!: string;
}
