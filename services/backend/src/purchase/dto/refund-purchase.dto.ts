import { IsNumber, IsPositive, IsString, MaxLength } from 'class-validator';

export class RefundPurchaseDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @MaxLength(500)
  reason: string;
}
