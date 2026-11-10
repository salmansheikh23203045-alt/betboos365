import { IsOptional, IsString, IsBoolean, IsInt, Min, Max } from 'class-validator';

export class SportEventQueryDto {
  @IsOptional()
  @IsString()
  sport?: string;

  @IsOptional()
  @IsString()
  league?: string;

  @IsOptional()
  @IsBoolean()
  liveOnly?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
