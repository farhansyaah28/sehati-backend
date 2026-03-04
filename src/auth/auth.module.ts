import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, FirebaseAuthGuard, RolesGuard],
  exports: [AuthService, FirebaseAuthGuard, RolesGuard],
})
export class AuthModule {}
