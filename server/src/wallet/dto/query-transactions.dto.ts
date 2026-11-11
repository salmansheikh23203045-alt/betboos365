import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionStatus } from '@prisma/client';

export enum TxTypeFilter {
  ALL = 'all',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
}

export class QueryTransactionsDto {
  @IsOptional()
  @IsEnum(TxTypeFilter)
  type?: TxTypeFilter;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsString()
  providerCode?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
