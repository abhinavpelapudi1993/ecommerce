import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { CreditService } from './credit.service';
import { GrantCreditDto } from './dto/grant-credit.dto';
import { DeductCreditDto } from './dto/deduct-credit.dto';
import type { CreditBalanceResponse } from './dto/credit-balance.dto';

@Controller('credits')
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Get(':customerId/balance')
  getBalance(@Param('customerId') customerId: string): Promise<CreditBalanceResponse> {
    return this.creditService.getBalance(customerId);
  }

  @Post(':customerId/grant')
  grantCredit(
    @Param('customerId') customerId: string,
    @Body() dto: GrantCreditDto,
  ): Promise<CreditBalanceResponse> {
    return this.creditService.grantCredit(customerId, dto);
  }

  @Post(':customerId/deduct')
  deductCredit(
    @Param('customerId') customerId: string,
    @Body() dto: DeductCreditDto,
  ): Promise<CreditBalanceResponse> {
    return this.creditService.deductCredit(customerId, dto);
  }
}
