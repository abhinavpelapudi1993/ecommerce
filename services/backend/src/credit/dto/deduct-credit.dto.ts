import { IsNumber, IsString, IsPositive, MaxLength } from 'class-validator';

export class DeductCreditDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @MaxLength(500)
  reason: string;
}
