import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class AddUnitStaffDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsIn(['MANAGER', 'OPERATOR'])
  role: string;
}
