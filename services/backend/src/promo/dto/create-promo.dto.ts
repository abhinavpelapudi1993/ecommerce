import {
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsIn,
  MaxLength,
  IsInt,
} from 'class-validator';

export class CreatePromoDto {
  @IsString()
  @MaxLength(50)
  code: string;

  @IsString()
  @IsIn(['percentage', 'fixed'])
  discountType: 'percentage' | 'fixed';

  @IsNumber()
  @IsPositive()
  discountValue: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  maxUses?: number;

  @IsOptional()
  @IsNumber()
  minPurchase?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
