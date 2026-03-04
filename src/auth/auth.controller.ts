import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/firebase-user.interface';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Login dengan Firebase ID Token
   * Client mengirim idToken setelah login via Firebase Auth (di frontend)
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.verifyTokenAndGetUser(loginDto.idToken);

    return {
      message: 'Login berhasil',
      data: {
        user,
      },
    };
  }

  /**
   * Get current user profile
   */
  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.authService.getUserProfile(user.uid);

    return {
      message: 'Berhasil mengambil profil',
      data: profile,
    };
  }

  /**
   * Verify token endpoint (untuk check apakah token masih valid)
   */
  @Get('verify')
  @UseGuards(FirebaseAuthGuard)
  verifyToken(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Token valid',
      data: {
        uid: user.uid,
        email: user.email,
        role: user.role,
        nama: user.nama,
      },
    };
  }

  /**
   * Logout endpoint
   * Note: Firebase Auth token revocation harus dilakukan di client
   * Endpoint ini untuk logging dan membersihkan state server-side jika ada
   */
  @Post('logout')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.logout(user.uid);
    return {
      message: 'Logout berhasil',
      data: null,
    };
  }
}
