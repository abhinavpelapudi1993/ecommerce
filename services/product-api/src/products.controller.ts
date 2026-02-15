import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductEntity } from './product.entity';

@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  listProducts(): Promise<ProductEntity[]> {
    return this.service.findAll();
  }

  @Get(':productId')
  getProduct(@Param('productId') productId: string): Promise<ProductEntity> {
    return this.service.findOne(productId);
  }

  @Post()
  createProduct(@Body() body: Partial<ProductEntity>): Promise<ProductEntity> {
    return this.service.create(body);
  }

  @Patch(':productId')
  updateProduct(
    @Param('productId') productId: string,
    @Body() body: Partial<ProductEntity>,
  ): Promise<ProductEntity> {
    return this.service.update(productId, body);
  }

  @Post(':productId/decrement-stock')
  decrementStock(
    @Param('productId') productId: string,
    @Body('quantity') quantity: number,
  ): Promise<ProductEntity> {
    return this.service.decrementStock(productId, quantity);
  }

  @Post(':productId/increment-stock')
  incrementStock(
    @Param('productId') productId: string,
    @Body('quantity') quantity: number,
  ): Promise<ProductEntity> {
    return this.service.incrementStock(productId, quantity);
  }

  @Delete(':productId')
  deleteProduct(@Param('productId') productId: string): Promise<void> {
    return this.service.remove(productId);
  }
}
