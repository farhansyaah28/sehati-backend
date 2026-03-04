/**
 * SEHATI - Role Constants
 * Mendefinisikan role yang tersedia dalam sistem
 */

export enum UserRole {
  ADMIN = 'admin',
  GURU = 'guru',
  SISWA = 'siswa',
  KANTIN = 'kantin',
}

export const ALL_ROLES = Object.values(UserRole);
