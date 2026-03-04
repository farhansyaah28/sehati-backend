import { IsString, IsOptional, IsNumber } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateKelasDto {
  @IsString()
  nama: string;

  @IsString()
  tingkat: string;

  @IsString()
  @IsOptional()
  waliKelas?: string;

  @IsString()
  @IsOptional()
  tahunAjaran?: string;
}

export class UpdateKelasDto extends PartialType(CreateKelasDto) {
  @IsNumber()
  @IsOptional()
  isActive?: boolean;
}
