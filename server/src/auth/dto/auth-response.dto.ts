import { Role } from '../../common/interfaces';

export class AuthResponseDto {
  accessToken!: string;
  refreshToken!: string;
  expiresIn!: number;
  user!: {
    id: string;
    username: string;
    email: string | null;
    firstName: string;
    lastName: string;
    roles: Role[];
  };
}
