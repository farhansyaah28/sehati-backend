import {
  Injectable,
  UnauthorizedException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { AuthenticatedUser } from '../common/interfaces/firebase-user.interface';
import { UserData } from '../common/interfaces/user-data.interface';
import { UserRole } from '../common/constants/roles.constant';

/**
 * Auth Service
 * Menangani autentikasi dengan Firebase dan manajemen session
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Verifikasi Firebase ID Token dan ambil data user dari Firestore
   * @param idToken - Firebase ID Token dari client
   * @returns AuthenticatedUser object
   */
  async verifyTokenAndGetUser(idToken: string): Promise<AuthenticatedUser> {
    try {
      // Verify token with Firebase Auth
      const decodedToken = await this.firebaseService.verifyIdToken(idToken);

      // Get user data from Firestore
      const userDoc = await this.firebaseService
        .collection('users')
        .doc(decodedToken.uid)
        .get();

      if (!userDoc.exists) {
        throw new NotFoundException(
          'User tidak ditemukan di database. Silakan hubungi admin.',
        );
      }

      const userData = userDoc.data() as UserData;

      if (!userData?.isActive) {
        throw new UnauthorizedException(
          'Akun Anda tidak aktif. Silakan hubungi admin.',
        );
      }

      return {
        uid: decodedToken.uid,
        email: decodedToken.email || userData.email,
        role: userData.role,
        nama: userData.nama,
        isActive: userData.isActive,
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error('Token verification failed', error);
      throw new UnauthorizedException(
        'Token tidak valid atau sudah kadaluarsa',
      );
    }
  }

  /**
   * Get user profile by UID
   * @param uid - User UID
   */
  async getUserProfile(uid: string): Promise<Record<string, unknown>> {
    const userDoc = await this.firebaseService
      .collection('users')
      .doc(uid)
      .get();

    if (!userDoc.exists) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const userData = userDoc.data();

    // Remove sensitive data
    delete userData?.password;

    return {
      uid,
      ...userData,
    };
  }

  /**
   * Check if user exists in database
   * @param uid - User UID
   */
  async userExists(uid: string): Promise<boolean> {
    const userDoc = await this.firebaseService
      .collection('users')
      .doc(uid)
      .get();

    return userDoc.exists;
  }

  /**
   * Get user role from Firestore
   * @param uid - User UID
   */
  async getUserRole(uid: string): Promise<UserRole | null> {
    const userDoc = await this.firebaseService
      .collection('users')
      .doc(uid)
      .get();

    if (!userDoc.exists) {
      return null;
    }

    return userDoc.data()?.role as UserRole;
  }

  /**
   * Logout user
   * Revoke semua refresh token user di Firebase
   * @param uid - User UID
   */
  async logout(uid: string): Promise<void> {
    try {
      // Revoke all refresh tokens untuk user ini
      // Ini akan membuat semua token yang sudah diterbitkan menjadi tidak valid
      await this.firebaseService.auth.revokeRefreshTokens(uid);
      this.logger.log(`User ${uid} logged out successfully`);
    } catch (error) {
      this.logger.error(`Error during logout for user ${uid}`, error);
      // Tidak throw error, karena logout tetap berhasil dari sisi client
    }
  }
}
