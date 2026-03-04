import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';

export class CreateProdukDto {
  @IsString()
  nama: string;

  @IsString()
  @IsOptional()
  deskripsi?: string;

  @IsNumber()
  @Min(0)
  harga: number;

  @IsString()
  @IsOptional()
  kategori?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  stock?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  gambarUrl?: string;
}
