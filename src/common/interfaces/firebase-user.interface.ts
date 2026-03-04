import { UserRole } from '../constants/roles.constant';

/**
 * Interface untuk decoded Firebase token
 */
export interface DecodedFirebaseToken {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
  sub: string;
  auth_time: number;
}

/**
 * Interface untuk user yang sudah terautentikasi
 * Digunakan di request setelah melewati guard
 */
export interface AuthenticatedUser {
  uid: string;
  email: string;
  role: UserRole;
  nama: string;
  isActive: boolean;
}

/**
 * Interface untuk request dengan user
 */
export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}
