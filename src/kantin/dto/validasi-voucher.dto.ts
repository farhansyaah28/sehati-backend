import { IsString } from 'class-validator';

export class ValidasiVoucherDto {
  @IsString()
  voucherRedemptionId: string;

  @IsString()
  siswaId: string;
}
