import { SetMetadata } from '@nestjs/common';
import { Permission } from '../interfaces';

export const PERMISSIONS_KEY = 'permissions';
/** The caller must hold at least one of the listed permissions. */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const PLAYER_ONLY_KEY = 'playerOnly';
/** Player feature: closed to Admin, Sub Admin and Agent accounts. */
export const PlayerOnly = () => SetMetadata(PLAYER_ONLY_KEY, true);

export const ALLOW_PENDING_PASSWORD_KEY = 'allowPendingPassword';
/**
 * Route stays open to an account that must still replace its temporary
 * password. Everything else answers 403 PasswordChangeRequired until it does.
 */
export const AllowPendingPasswordChange = () => SetMetadata(ALLOW_PENDING_PASSWORD_KEY, true);
