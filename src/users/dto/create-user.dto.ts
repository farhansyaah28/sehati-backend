import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../common/constants/roles.constant';

export class CreateUserDto {
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  nama: string;

  @IsEnum(UserRole, { message: 'Role tidak valid' })
  @IsNotEmpty({ message: 'Role tidak boleh kosong' })
  role: UserRole;

  @IsString()
  @IsOptional()
  nis?: string; // Nomor Induk Siswa (untuk siswa)

  @IsString()
  @IsOptional()
  nip?: string; // Nomor Induk Pegawai (untuk guru/admin)

  @IsString()
  @IsOptional()
  kelas?: string; // Kelas siswa (e.g., "7A", "8B")

  @IsString()
  @IsOptional()
  phone?: string;
}
