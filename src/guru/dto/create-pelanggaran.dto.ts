import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreatePelanggaranDto {
  @IsString()
  @IsNotEmpty({ message: 'Siswa ID tidak boleh kosong' })
  siswaId: string;

  @IsString()
  @IsNotEmpty({ message: 'Jenis pelanggaran ID tidak boleh kosong' })
  jenisPelanggaranId: string;

  @IsString()
  @IsOptional()
  keterangan?: string;

  @IsUrl({}, { message: 'Format URL bukti tidak valid' })
  @IsOptional()
  buktiUrl?: string;
}
