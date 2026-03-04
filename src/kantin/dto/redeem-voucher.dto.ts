import { IsNotEmpty, IsString } from 'class-validator';

export class RedeemVoucherDto {
  @IsString()
  @IsNotEmpty({ message: 'Siswa ID tidak boleh kosong' })
  siswaId: string;

  @IsString()
  @IsNotEmpty({ message: 'Voucher ID tidak boleh kosong' })
  voucherId: string;
}
