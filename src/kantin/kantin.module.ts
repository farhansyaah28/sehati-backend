import { Module } from '@nestjs/common';
import { KantinController } from './kantin.controller';
import { KantinService } from './kantin.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [KantinController],
  providers: [KantinService],
  exports: [KantinService],
})
export class KantinModule {}
