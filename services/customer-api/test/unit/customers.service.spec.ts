import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CustomersService } from '../../src/customers.service';
import { CustomerEntity } from '../../src/customer.entity';

describe('CustomersService', () => {
  let service: CustomersService;
  let mockRepo: Record<string, jest.Mock>;

  const mockCustomer: Partial<CustomerEntity> = {
    id: 'c0a80001-0000-4000-8000-000000000001',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    billingAddress: {
      line1: '123 Main St',
      city: 'Springfield',
      postalCode: '62701',
      state: 'IL',
      country: 'US',
    },
    shippingAddress: {
      line1: '123 Main St',
      city: 'Springfield',
      postalCode: '62701',
      state: 'IL',
      country: 'US',
    },
    createdAt: new Date(),
    lastModifiedAt: new Date(),
  };

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn().mockResolvedValue([mockCustomer]),
      findOne: jest.fn().mockResolvedValue(mockCustomer),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: getRepositoryToken(CustomerEntity), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  describe('findAll', () => {
    it('should return all customers when no query is provided', async () => {
      const result = await service.findAll();

      expect(mockRepo.find).toHaveBeenCalledWith();
      expect(result).toEqual([mockCustomer]);
    });

    it('should search by email and name when query is provided', async () => {
      await service.findAll('alice');

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: [
          { email: expect.objectContaining({ _value: '%alice%' }) },
          { name: expect.objectContaining({ _value: '%alice%' }) },
        ],
      });
    });
  });

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      const result = await service.findOne(mockCustomer.id!);

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockCustomer.id },
      });
      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundException when customer does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
