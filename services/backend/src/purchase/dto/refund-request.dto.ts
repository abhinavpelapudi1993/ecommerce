import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { RefundRequestType } from '../entities/refund-request.entity';

export class CreateRefundRequestDto {
  @IsString()
  customerId: string;

  @IsEnum(RefundRequestType)
  type: RefundRequestType;

  @IsString()
  reason: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  requestedAmount?: number;
}

export class ApproveRefundRequestDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class RejectRefundRequestDto {
  @IsOptional()
  @IsString()
  note?: string;
}
