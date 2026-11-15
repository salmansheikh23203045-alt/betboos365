import { IsArray, IsBoolean, IsEnum } from 'class-validator';
import { Role } from '../../common/interfaces';

export class UpdateUserRoleDto {
  @IsArray()
  @IsEnum(Role, { each: true })
  roles!: Role[];
}

export class PhoneVerificationDto {
  @IsBoolean()
  verified!: boolean;
}
