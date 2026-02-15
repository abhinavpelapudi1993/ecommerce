import { Controller, Get, Param, Query } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomerEntity } from './customer.entity';

@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Get()
  listCustomers(@Query('q') query?: string): Promise<CustomerEntity[]> {
    return this.service.findAll(query);
  }

  @Get(':customerId')
  getCustomer(@Param('customerId') customerId: string): Promise<CustomerEntity> {
    return this.service.findOne(customerId);
  }
}
