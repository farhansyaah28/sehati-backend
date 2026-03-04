import { Module } from '@nestjs/common';
import { GuruController } from './guru.controller';
import { GuruService } from './guru.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [GuruController],
  providers: [GuruService],
  exports: [GuruService],
})
export class GuruModule {}
