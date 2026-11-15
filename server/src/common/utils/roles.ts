import { UserRole } from '@prisma/client';

export function parseRoles(value: unknown): UserRole[] {
  if (Array.isArray(value)) return value as UserRole[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed as UserRole[];
    } catch {
      /* fall through */
    }
  }
  return [];
}
