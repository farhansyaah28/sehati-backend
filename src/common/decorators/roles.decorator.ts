import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../constants/roles.constant';

export const ROLES_KEY = 'roles';

/**
 * Decorator untuk menentukan role yang diizinkan mengakses endpoint
 * @example @Roles(UserRole.ADMIN, UserRole.GURU)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
