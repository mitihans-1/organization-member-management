import type { User } from '../types';

export function defaultPathForRole(role: User['role'] | undefined): string {
  switch (role) {
    case 'SuperAdmin':
      return '/super-admin';
    case 'organAdmin':
      return '/org';
    case 'member':
      return '/member';
    default:
      return '/';
  }
}
