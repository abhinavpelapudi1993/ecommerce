import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ProductApiService } from './product-api.service';
import type { Product, CreateProductRequest, UpdateProductRequest } from './types';

@Controller('products')
export class ProductsController {
  constructor(private readonly productApi: ProductApiService) {}

  @Get()
  listProducts(): Promise<Product[]> {
    return this.productApi.listProducts();
  }

  @Get(':productId')
  getProduct(@Param('productId') productId: string): Promise<Product> {
    return this.productApi.getProduct(productId);
  }

  @Post()
  createProduct(@Body() body: CreateProductRequest): Promise<Product> {
    return this.productApi.createProduct(body);
  }

  @Patch(':productId')
  updateProduct(
    @Param('productId') productId: string,
    @Body() body: UpdateProductRequest,
  ): Promise<Product> {
    return this.productApi.updateProduct(productId, body);
  }

  @Delete(':productId')
  deleteProduct(@Param('productId') productId: string): Promise<void> {
    return this.productApi.deleteProduct(productId);
  }
}
