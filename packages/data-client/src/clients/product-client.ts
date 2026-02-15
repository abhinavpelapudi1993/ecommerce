import { BaseClient } from './base-client';
import type { Product, CreateProductRequest, UpdateProductRequest } from '../types/product';

function normalizeProduct(p: Product): Product {
  return { ...p, price: Number(p.price), stock: Number(p.stock) };
}

export class ProductClient extends BaseClient {
  async listProducts(): Promise<Product[]> {
    const list = await this.get<Product[]>('/products');
    return list.map(normalizeProduct);
  }

  async getProduct(productId: string): Promise<Product> {
    return normalizeProduct(await this.get<Product>(`/products/${productId}`));
  }

  async createProduct(request: CreateProductRequest): Promise<Product> {
    return normalizeProduct(await this.post<Product>('/products', request));
  }

  async updateProduct(productId: string, request: UpdateProductRequest): Promise<Product> {
    return normalizeProduct(await this.patch<Product>(`/products/${productId}`, request));
  }

  async deleteProduct(productId: string): Promise<void> {
    await this.delete(`/products/${productId}`);
  }
}
