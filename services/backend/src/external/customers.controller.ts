import { Controller, Get, Param, Query } from '@nestjs/common';
import { CustomerApiService } from './customer-api.service';
import type { Customer } from './types';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customerApi: CustomerApiService) {}

  @Get()
  searchCustomers(@Query('q') query?: string): Promise<Customer[]> {
    return this.customerApi.searchCustomers(query);
  }

  @Get(':customerId')
  getCustomer(@Param('customerId') customerId: string): Promise<Customer> {
    return this.customerApi.getCustomer(customerId);
  }
}
