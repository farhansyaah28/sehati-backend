import { IsNotEmpty, IsString } from 'class-validator';

export class ScanAbsensiDto {
  @IsString()
  @IsNotEmpty({ message: 'NIS tidak boleh kosong' })
  nis: string;
}
