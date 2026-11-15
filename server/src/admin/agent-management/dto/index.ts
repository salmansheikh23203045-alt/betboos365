import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Permission } from '../../../common/interfaces';
import { SUB_ADMIN_GRANTABLE } from '../../../common/permissions';

const PASSWORD_RULE = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
const PASSWORD_MESSAGE =
  'Password must contain at least one uppercase letter, one lowercase letter, and one digit';

export class CreateStaffDto {
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'Username may only contain letters, digits, dots, underscores, and hyphens',
  })
  username!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?\d{7,15}$/, { message: 'Invalid phone number format' })
  phone?: string;
}

export class CreateSubAdminDto extends CreateStaffDto {
  /** Omit to start with the default Sub Admin permissions. */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(SUB_ADMIN_GRANTABLE, { each: true })
  permissions?: Permission[];
}

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?\d{7,15}$/, { message: 'Invalid phone number format' })
  phone?: string;
}

export class StaffStatusDto {
  @IsBoolean()
  isActive!: boolean;
}

export class ResetStaffPasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  password!: string;
}

export class SetSubAdminPermissionsDto {
  @IsArray()
  @ArrayUnique()
  @IsIn(SUB_ADMIN_GRANTABLE, { each: true })
  permissions!: Permission[];
}
