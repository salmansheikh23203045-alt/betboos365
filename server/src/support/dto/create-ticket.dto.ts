import { IsString, IsEnum, MaxLength, MinLength } from 'class-validator';
import { TicketPriority } from '../../common/interfaces';

export class CreateTicketDto {
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  subject!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message!: string;

  @IsEnum(TicketPriority)
  priority!: TicketPriority;
}
