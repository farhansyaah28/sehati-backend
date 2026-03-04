import { IsEmail, IsOptional, IsString } from 'class-validator';

/**
 * DTO untuk update user
 * Password dan role tidak bisa diupdate melalui endpoint ini
 */
export class UpdateUserDto {
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  nama?: string;

  @IsString()
  @IsOptional()
  nis?: string;

  @IsString()
  @IsOptional()
  nip?: string;

  @IsString()
  @IsOptional()
  kelas?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
