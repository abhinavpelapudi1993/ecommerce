import { BaseClient } from './base-client';
import type { Customer } from '../types/customer';

export class CustomerClient extends BaseClient {
  async searchCustomers(query?: string): Promise<Customer[]> {
    const params = query ? `?q=${encodeURIComponent(query)}` : '';
    return this.get<Customer[]>(`/customers${params}`);
  }

  async getCustomer(customerId: string): Promise<Customer> {
    return this.get<Customer>(`/customers/${customerId}`);
  }
}
