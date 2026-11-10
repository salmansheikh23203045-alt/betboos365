import { IsString, IsBoolean, IsOptional, IsInt, Min, IsDateString } from 'class-validator';

export class CreatePromotionDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  badge!: string;

  @IsString()
  ctaLabel!: string;

  @IsString()
  ctaHref!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minVipLevel?: number;
}
