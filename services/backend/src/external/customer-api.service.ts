import { Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CacheService } from '../cache/cache.service';
import type { AppConfig } from '../config/app.config';
import type { Customer } from './types';

const CUSTOMER_CACHE_TTL = 60; // 1 minute

@Injectable()
export class CustomerApiService {
  constructor(
    private readonly http: HttpService,
    private readonly cache: CacheService,
    @Inject('APP_CONFIG') private readonly config: AppConfig,
  ) {}

  async getCustomer(customerId: string): Promise<Customer> {
    return this.cache.getOrFetch(
      `customer:${customerId}`,
      CUSTOMER_CACHE_TTL,
      async () => {
        const url = `${this.config.customerApiUrl}/customers/${customerId}`;
        const { data } = await firstValueFrom(this.http.get<Customer>(url));
        return data;
      },
    );
  }

  async searchCustomers(query?: string): Promise<Customer[]> {
    const params = query ? `?q=${encodeURIComponent(query)}` : '';
    const url = `${this.config.customerApiUrl}/customers${params}`;
    const { data } = await firstValueFrom(this.http.get<Customer[]>(url));
    return data;
  }
}
