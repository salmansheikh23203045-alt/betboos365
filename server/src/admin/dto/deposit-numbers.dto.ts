import { IsOptional, IsString } from 'class-validator';

export class UpdateDepositNumbersDto {
  @IsString()
  @IsOptional()
  depositNumber?: string;

  @IsString()
  @IsOptional()
  agentSendMoneyCashoutNumber?: string;
}
