import { IsString, IsNumber, IsPositive, MaxLength } from 'class-validator';

export class ValidatePromoDto {
  @IsString()
  @MaxLength(50)
  code: string;

  @IsNumber()
  @IsPositive()
  purchaseAmount: number;
}

export interface ValidatePromoResponse {
  valid: boolean;
  discountAmount: number;
  message?: string;
}
