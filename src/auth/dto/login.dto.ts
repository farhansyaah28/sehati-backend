import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'ID Token tidak boleh kosong' })
  idToken: string;
}
