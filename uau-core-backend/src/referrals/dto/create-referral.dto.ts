import { IsNotEmpty, IsString } from 'class-validator';

export class CreateReferralDto {
  @IsString()
  @IsNotEmpty()
  referrerId: string; // ID do usuário que indicou

  @IsString()
  @IsNotEmpty()
  referredId: string; // ID do novo usuário (indicado)
}
