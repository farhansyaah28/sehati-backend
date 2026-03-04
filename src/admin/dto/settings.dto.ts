import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  coinsPerAbsensi?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  streakBonusPercentage?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  streakDays?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  coinToRupiahRate?: number;
}
