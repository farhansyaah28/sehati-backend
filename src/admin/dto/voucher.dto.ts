import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateVoucherDto {
  @IsString()
  nama: string;

  @IsString()
  @IsOptional()
  deskripsi?: string;

  @IsNumber()
  @Min(0)
  discountAmount: number;

  @IsNumber()
  @Min(0)
  coinsRequired: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  stock?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  expiredAt?: string;
}

export class UpdateVoucherDto extends PartialType(CreateVoucherDto) {}

export class DistributeVoucherDto {
  @IsString()
  voucherId: string;

  @IsArray()
  @IsString({ each: true })
  siswaIds: string[];
}
