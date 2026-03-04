import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  IsBoolean,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class TransaksiItemDto {
  @IsString()
  @IsNotEmpty()
  produkId: string;

  @IsNumber()
  @Min(1)
  qty: number;
}

export class CreateTransaksiDto {
  @IsString()
  @IsNotEmpty({ message: 'Siswa ID tidak boleh kosong' })
  siswaId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransaksiItemDto)
  items: TransaksiItemDto[];

  @IsString()
  @IsOptional()
  voucherRedemptionId?: string;

  @IsBoolean()
  @IsOptional()
  useCoins?: boolean;

  @IsString()
  @IsOptional()
  metodePembayaran?: string; // tunai, qris, etc
}
