import { IsString, IsUUID, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class ListPurchasesDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @IsUUID()
  customerId?: string;
}
