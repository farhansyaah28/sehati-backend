import { IsNotEmpty, IsString } from 'class-validator';

export class ScanSiswaDto {
  @IsString()
  @IsNotEmpty({ message: 'NIS tidak boleh kosong' })
  nis: string;
}
