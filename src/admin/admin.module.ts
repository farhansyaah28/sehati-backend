import { Module } from '@nestjs/common';
import { AdminController, SettingsController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AdminController, SettingsController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
