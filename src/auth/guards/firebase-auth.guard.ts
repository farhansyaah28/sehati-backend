import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { FirebaseService } from '../../firebase/firebase.service';
import { AuthenticatedUser } from '../../common/interfaces/firebase-user.interface';
import { UserRole } from '../../common/constants/roles.constant';

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

/**
 * Firebase Authentication Guard
 * Memverifikasi Firebase ID Token dari header Authorization
 */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Token tidak ditemukan');
    }

    // Extract token from "Bearer <token>"
    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException(
        'Format token tidak valid. Gunakan: Bearer <token>',
      );
    }

    try {
      const decodedToken = await this.firebaseService.verifyIdToken(token);

      // Get user data from Firestore
      const userDoc = await this.firebaseService
        .collection('users')
        .doc(decodedToken.uid)
        .get();

      if (!userDoc.exists) {
        throw new UnauthorizedException(
          'User tidak ditemukan. Silakan hubungi admin.',
        );
      }

      const userData = userDoc.data() as Record<string, unknown> | undefined;

      if (!userData?.isActive) {
        throw new UnauthorizedException(
          'Akun Anda tidak aktif. Silakan hubungi admin.',
        );
      }

      request.user = {
        uid: decodedToken.uid,
        email: (decodedToken.email as string) || String(userData.email),
        role: userData.role as UserRole,
        nama: String(userData.nama),
        isActive: Boolean(userData.isActive),
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Token verification failed', error);
      throw new UnauthorizedException(
        'Token tidak valid atau sudah kadaluarsa',
      );
    }
  }
}
