import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateGameDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumbnailUrl?: string;
}
