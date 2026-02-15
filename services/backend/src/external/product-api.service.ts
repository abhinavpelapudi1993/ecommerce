import { Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CacheService } from '../cache/cache.service';
import type { AppConfig } from '../config/app.config';
import type { Product, CreateProductRequest, UpdateProductRequest } from './types';

const PRODUCT_CACHE_TTL = 60; // 1 minute

@Injectable()
export class ProductApiService {
  constructor(
    private readonly http: HttpService,
    private readonly cache: CacheService,
    @Inject('APP_CONFIG') private readonly config: AppConfig,
  ) {}

  async listProducts(): Promise<Product[]> {
    return this.cache.getOrFetch(
      'products:all',
      PRODUCT_CACHE_TTL,
      async () => {
        const url = `${this.config.productApiUrl}/products`;
        const { data } = await firstValueFrom(this.http.get<Product[]>(url));
        return data;
      },
    );
  }

  async getProduct(productId: string): Promise<Product> {
    return this.cache.getOrFetch(
      `product:${productId}`,
      PRODUCT_CACHE_TTL,
      async () => {
        const url = `${this.config.productApiUrl}/products/${productId}`;
        const { data } = await firstValueFrom(this.http.get<Product>(url));
        return data;
      },
    );
  }

  async createProduct(request: CreateProductRequest): Promise<Product> {
    const url = `${this.config.productApiUrl}/products`;
    const { data } = await firstValueFrom(this.http.post<Product>(url, request));
    await this.cache.invalidate('products:all');
    return data;
  }

  async updateProduct(productId: string, request: UpdateProductRequest): Promise<Product> {
    const url = `${this.config.productApiUrl}/products/${productId}`;
    const { data } = await firstValueFrom(this.http.patch<Product>(url, request));
    await this.cache.invalidate(`product:${productId}`);
    await this.cache.invalidate('products:all');
    return data;
  }

  async decrementStock(productId: string, quantity: number): Promise<Product> {
    const url = `${this.config.productApiUrl}/products/${productId}/decrement-stock`;
    try {
      const { data } = await firstValueFrom(
        this.http.post<Product>(url, { quantity }),
      );
      await this.cache.invalidate(`product:${productId}`);
      await this.cache.invalidate('products:all');
      return data;
    } catch (err) {
      // Invalidate cache on failure so stale stock values don't persist
      await this.cache.invalidate(`product:${productId}`);
      await this.cache.invalidate('products:all');
      throw err;
    }
  }

  async incrementStock(productId: string, quantity: number): Promise<Product> {
    const url = `${this.config.productApiUrl}/products/${productId}/increment-stock`;
    try {
      const { data } = await firstValueFrom(
        this.http.post<Product>(url, { quantity }),
      );
      await this.cache.invalidate(`product:${productId}`);
      await this.cache.invalidate('products:all');
      return data;
    } catch (err) {
      await this.cache.invalidate(`product:${productId}`);
      await this.cache.invalidate('products:all');
      throw err;
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    const url = `${this.config.productApiUrl}/products/${productId}`;
    await firstValueFrom(this.http.delete(url));
    await this.cache.invalidate(`product:${productId}`);
    await this.cache.invalidate('products:all');
  }
}
