import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { CustomerEntity } from './customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly repo: Repository<CustomerEntity>,
  ) {}

  async findAll(query?: string): Promise<CustomerEntity[]> {
    if (!query) return this.repo.find();
    const q = `%${query}%`;
    return this.repo.find({
      where: [
        { email: ILike(q) },
        { name: ILike(q) },
      ],
    });
  }

  async findOne(id: string): Promise<CustomerEntity> {
    const customer = await this.repo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    return customer;
  }
}
