import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAbsensiDto {
  @IsString()
  @IsNotEmpty({ message: 'Siswa ID tidak boleh kosong' })
  siswaId: string;

  @IsString()
  @IsOptional()
  keterangan?: string;
}
