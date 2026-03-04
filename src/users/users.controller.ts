import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/constants/roles.constant';
import type { AuthenticatedUser } from '../common/interfaces/firebase-user.interface';

@Controller('users')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Create new user (Admin only)
   */
  @Post()
  @Roles(UserRole.ADMIN)
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const newUser = await this.usersService.create(createUserDto, user.uid);
    return {
      message: 'User berhasil dibuat',
      data: newUser,
    };
  }

  /**
   * Get all users (Admin only)
   */
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: string,
    @Query('kelas') kelas?: string,
  ) {
    const filters = {
      role,
      isActive: isActive ? isActive === 'true' : undefined,
      kelas,
    };

    const users = await this.usersService.findAll(filters);
    return {
      message: 'Berhasil mengambil data users',
      data: users,
    };
  }

  /**
   * Get user by UID (Admin only)
   */
  @Get(':uid')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('uid') uid: string) {
    const user = await this.usersService.findOne(uid);
    return {
      message: 'Berhasil mengambil data user',
      data: user,
    };
  }

  /**
   * Update user (Admin only)
   */
  @Patch(':uid')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('uid') uid: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const updatedUser = await this.usersService.update(
      uid,
      updateUserDto,
      user.uid,
    );
    return {
      message: 'User berhasil diupdate',
      data: updatedUser,
    };
  }

  /**
   * Deactivate user (Admin only)
   */
  @Delete(':uid')
  @Roles(UserRole.ADMIN)
  async deactivate(
    @Param('uid') uid: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.usersService.deactivate(uid, user.uid);
    return result;
  }

  /**
   * Activate user (Admin only)
   */
  @Patch(':uid/activate')
  @Roles(UserRole.ADMIN)
  async activate(
    @Param('uid') uid: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.usersService.activate(uid, user.uid);
    return result;
  }
}
