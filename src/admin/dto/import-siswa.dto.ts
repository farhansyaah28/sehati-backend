import { IsArray, ValidateNested, IsString, IsOptional, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

class SiswaImportItem {
  @IsString()
  nama: string;

  @IsString()
  nis: string;

  @IsEmail()
  email: string;

  @IsString()
  kelas: string;

  @IsString()
  @IsOptional()
  jenisKelamin?: string;

  @IsString()
  @IsOptional()
  alamat?: string;

  @IsString()
  @IsOptional()
  noTelp?: string;
}

export class ImportSiswaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SiswaImportItem)
  data: SiswaImportItem[];
}
