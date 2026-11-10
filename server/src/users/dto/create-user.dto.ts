import { Role } from '../../common/interfaces';

export class CreateUserDto {
  username!: string;
  firstName!: string;
  lastName!: string;
  email?: string;
  phone?: string;
  passwordHash!: string;
  roles!: Role[];
}
