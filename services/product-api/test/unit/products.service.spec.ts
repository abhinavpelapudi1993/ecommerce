import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from '../../src/products.service';
import { ProductEntity } from '../../src/product.entity';

describe('ProductsService', () => {
  let service: ProductsService;
  let mockRepo: Record<string, jest.Mock>;

  const mockProduct: Partial<ProductEntity> = {
    id: 'p0a80001-0000-4000-8000-000000000001',
    sku: 'LAPTOP-001',
    name: 'Gaming Laptop',
    description: 'High-performance gaming laptop',
    price: 1299.99,
    stock: 50,
    createdAt: new Date(),
    lastModifiedAt: new Date(),
  };

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn().mockResolvedValue([mockProduct]),
      findOne: jest.fn().mockResolvedValue(mockProduct),
      create: jest.fn().mockImplementation((data) => ({ ...data, id: 'new-id' })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(ProductEntity), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('findAll', () => {
    it('should return all products ordered by createdAt ASC', async () => {
      const result = await service.findAll();

      expect(mockRepo.find).toHaveBeenCalledWith({ order: { createdAt: 'ASC' } });
      expect(result).toEqual([mockProduct]);
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const result = await service.findOne(mockProduct.id!);

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockProduct.id },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new product with lastModifiedAt set', async () => {
      const data = { sku: 'NEW-001', name: 'New Product', price: 99.99, stock: 10 };

      await service.create(data);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...data,
          lastModifiedAt: expect.any(Date),
        }),
      );
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a product and set lastModifiedAt', async () => {
      const updateData = { stock: 25 };

      const result = await service.update(mockProduct.id!, updateData);

      expect(mockRepo.findOne).toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ stock: 25 }),
      );
    });

    it('should throw NotFoundException when updating non-existent product', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', { stock: 10 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      await service.remove(mockProduct.id!);

      expect(mockRepo.findOne).toHaveBeenCalled();
      expect(mockRepo.remove).toHaveBeenCalledWith(mockProduct);
    });

    it('should throw NotFoundException when removing non-existent product', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
