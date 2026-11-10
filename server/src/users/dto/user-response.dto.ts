import { Role } from '../../common/interfaces';

export class UserResponseDto {
  id!: string;
  username!: string;
  firstName!: string;
  lastName!: string;
  email!: string | null;
  phone!: string | null;
  roles!: Role[];
  vipLevel!: number;
  isActive!: boolean;
  createdAt!: string;
}
