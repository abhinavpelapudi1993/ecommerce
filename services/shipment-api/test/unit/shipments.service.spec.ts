import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ShipmentsService } from '../../src/shipments.service';
import {
  ShipmentEntity,
  ShipmentStatus,
  ShippingAddress,
  ShipmentProduct,
} from '../../src/shipment.entity';

describe('ShipmentsService', () => {
  let service: ShipmentsService;
  let mockRepo: Record<string, jest.Mock>;

  const mockAddress: ShippingAddress = {
    line1: '123 Main St',
    city: 'Springfield',
    postalCode: '62701',
    state: 'IL',
    country: 'US',
  };

  const mockProducts: ShipmentProduct[] = [{ sku: 'LAPTOP-001', quantity: 1 }];

  const mockShipment: Partial<ShipmentEntity> = {
    id: 's0a80001-0000-4000-8000-000000000001',
    status: ShipmentStatus.Processing,
    trackingNumber: 'TRK-ABC1234567',
    shippingAddress: mockAddress,
    products: mockProducts,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockRepo = {
      findOne: jest.fn().mockResolvedValue({ ...mockShipment }),
      create: jest.fn().mockImplementation((data) => ({ id: 'new-id', ...data })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShipmentsService,
        { provide: getRepositoryToken(ShipmentEntity), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ShipmentsService>(ShipmentsService);
  });

  describe('create', () => {
    it('should create a shipment with Processing status and tracking number', async () => {
      const result = await service.create(mockAddress, mockProducts);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ShipmentStatus.Processing,
          trackingNumber: expect.stringMatching(/^TRK-[A-Z0-9]{10}$/),
          shippingAddress: mockAddress,
          products: mockProducts,
        }),
      );
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a shipment by id', async () => {
      const result = await service.findOne(mockShipment.id!);

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockShipment.id },
      });
      expect(result.trackingNumber).toBe(mockShipment.trackingNumber);
    });

    it('should throw NotFoundException when shipment does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update status to Shipped', async () => {
      const result = await service.updateStatus(
        mockShipment.id!,
        ShipmentStatus.Shipped,
      );

      expect(result.status).toBe(ShipmentStatus.Shipped);
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should update status to Delivered', async () => {
      const result = await service.updateStatus(
        mockShipment.id!,
        ShipmentStatus.Delivered,
      );

      expect(result.status).toBe(ShipmentStatus.Delivered);
    });

    it('should throw BadRequestException for invalid status', async () => {
      await expect(
        service.updateStatus(mockShipment.id!, 'invalid-status' as ShipmentStatus),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when shipment does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus('nonexistent-id', ShipmentStatus.Shipped),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
