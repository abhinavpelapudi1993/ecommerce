import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly repo: Repository<ProductEntity>,
  ) {}

  async findAll(): Promise<ProductEntity[]> {
    return this.repo.find({ order: { createdAt: 'ASC' } });
  }

  async findOne(id: string): Promise<ProductEntity> {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async create(data: Partial<ProductEntity>): Promise<ProductEntity> {
    const product = this.repo.create({
      ...data,
      lastModifiedAt: new Date(),
    });
    return this.repo.save(product);
  }

  async update(id: string, data: Partial<ProductEntity>): Promise<ProductEntity> {
    const product = await this.findOne(id);
    Object.assign(product, data, { lastModifiedAt: new Date() });
    return this.repo.save(product);
  }

  async decrementStock(id: string, quantity: number): Promise<ProductEntity> {
    const result = await this.repo
      .createQueryBuilder()
      .update(ProductEntity)
      .set({
        stock: () => `stock - ${quantity}`,
        lastModifiedAt: new Date(),
      })
      .where('id = :id AND stock >= :quantity', { id, quantity })
      .returning('*')
      .execute();

    if (!result.affected || result.affected === 0) {
      const product = await this.repo.findOne({ where: { id } });
      if (!product) throw new NotFoundException(`Product ${id} not found`);
      throw new NotFoundException(
        `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`,
      );
    }

    return result.raw[0] as ProductEntity;
  }

  async incrementStock(id: string, quantity: number): Promise<ProductEntity> {
    const result = await this.repo
      .createQueryBuilder()
      .update(ProductEntity)
      .set({
        stock: () => `stock + ${quantity}`,
        lastModifiedAt: new Date(),
      })
      .where('id = :id', { id })
      .returning('*')
      .execute();

    if (!result.affected || result.affected === 0) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return result.raw[0] as ProductEntity;
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.repo.remove(product);
  }
}
