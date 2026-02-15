import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * Refund request flow E2E test.
 * Requires: postgres + redis + microservices running (docker-compose up).
 * Run with: npm run test:e2e
 */
describe('Refund Flow (e2e)', () => {
  let app: INestApplication;

  const customerId = 'c0a80001-0000-4000-8000-000000000001';
  const productId = 'a1b2c3d4-e5f6-4a1b-8c2d-1a2b3c4d5e02'; // ErgoMouse at $49.99

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  async function createSettledPurchase(): Promise<string> {
    // Grant credit
    await request(app.getHttpServer())
      .post(`/credits/${customerId}/grant`)
      .send({ amount: 200, reason: 'Refund test credit' })
      .expect(201);

    // Purchase
    const purchaseRes = await request(app.getHttpServer())
      .post('/purchases')
      .send({ customerId, productId, quantity: 1 })
      .expect(201);

    const purchaseId = purchaseRes.body.id;
    const shipmentId = purchaseRes.body.shipmentId;

    // Deliver shipment to auto-settle
    await request(app.getHttpServer())
      .patch(`/shipments/${shipmentId}`)
      .send({ status: 'shipped' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/shipments/${shipmentId}`)
      .send({ status: 'delivered' })
      .expect(200);

    // Verify settled
    const purchase = await request(app.getHttpServer())
      .get(`/purchases/${purchaseId}`)
      .expect(200);

    expect(purchase.body.status).toBe('settled');

    return purchaseId;
  }

  it('should create, approve, and complete a refund request', async () => {
    const purchaseId = await createSettledPurchase();

    // 1. Create refund request
    const refundReqRes = await request(app.getHttpServer())
      .post(`/purchases/${purchaseId}/refund-request`)
      .send({ customerId, reason: 'Item defective', requestedAmount: 20 })
      .expect(201);

    expect(refundReqRes.body.status).toBe('pending');
    const requestId = refundReqRes.body.id;

    // 2. Approve refund
    const approveRes = await request(app.getHttpServer())
      .post(`/refund-requests/${requestId}/approve`)
      .send({ amount: 20, note: 'Approved by support' })
      .expect(201);

    expect(approveRes.body.status).toBe('approved');

    // 3. Verify purchase is partially refunded
    const purchase = await request(app.getHttpServer())
      .get(`/purchases/${purchaseId}`)
      .expect(200);

    expect(purchase.body.status).toBe('partially_refunded');
    expect(purchase.body.refundedAmount).toBe(20);
  });

  it('should reject a refund request', async () => {
    const purchaseId = await createSettledPurchase();

    // Create refund request
    const refundReqRes = await request(app.getHttpServer())
      .post(`/purchases/${purchaseId}/refund-request`)
      .send({ customerId, reason: 'Changed my mind' })
      .expect(201);

    // Reject it
    const rejectRes = await request(app.getHttpServer())
      .post(`/refund-requests/${refundReqRes.body.id}/reject`)
      .send({ note: 'Policy does not cover this' })
      .expect(201);

    expect(rejectRes.body.status).toBe('rejected');
  });

  it('should reject refund request exceeding max refundable amount', async () => {
    const purchaseId = await createSettledPurchase();

    // Try to request more than purchase total
    await request(app.getHttpServer())
      .post(`/purchases/${purchaseId}/refund-request`)
      .send({ customerId, reason: 'Greedy refund', requestedAmount: 9999 })
      .expect(400);
  });
});
