import { IsArray, IsEnum } from 'class-validator';
import { Role } from '../../common/interfaces';

export class UpdateUserRoleDto {
  @IsArray()
  @IsEnum(Role, { each: true })
  roles!: Role[];
}
