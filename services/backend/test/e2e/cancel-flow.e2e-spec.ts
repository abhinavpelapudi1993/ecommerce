import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * Cancel flow E2E test.
 * Requires: postgres + redis + microservices running (docker-compose up).
 * Run with: npm run test:e2e
 */
describe('Cancel Flow (e2e)', () => {
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

  it('should cancel a pending order and refund credit', async () => {
    // 1. Grant credit
    await request(app.getHttpServer())
      .post(`/credits/${customerId}/grant`)
      .send({ amount: 100, reason: 'Cancel test credit' })
      .expect(201);

    // 2. Get balance before purchase
    const beforeBalance = await request(app.getHttpServer())
      .get(`/credits/${customerId}/balance`)
      .expect(200);

    // 3. Purchase a product
    const purchaseRes = await request(app.getHttpServer())
      .post('/purchases')
      .send({ customerId, productId, quantity: 1 })
      .expect(201);

    const purchaseId = purchaseRes.body.id;
    expect(purchaseRes.body.status).toBe('completed');

    // 4. Cancel the order
    const cancelRes = await request(app.getHttpServer())
      .post(`/purchases/${purchaseId}/cancel`)
      .send({ customerId })
      .expect(201);

    expect(cancelRes.body.status).toBe('cancelled');

    // 5. Verify credit was refunded
    const afterBalance = await request(app.getHttpServer())
      .get(`/credits/${customerId}/balance`)
      .expect(200);

    expect(afterBalance.body.balance).toBeCloseTo(beforeBalance.body.balance, 1);
  });

  it('should reject cancel for non-owner', async () => {
    // 1. Grant credit and purchase
    await request(app.getHttpServer())
      .post(`/credits/${customerId}/grant`)
      .send({ amount: 100, reason: 'Cancel ownership test' })
      .expect(201);

    const purchaseRes = await request(app.getHttpServer())
      .post('/purchases')
      .send({ customerId, productId, quantity: 1 })
      .expect(201);

    // 2. Try to cancel with wrong customer
    await request(app.getHttpServer())
      .post(`/purchases/${purchaseRes.body.id}/cancel`)
      .send({ customerId: 'c0a80001-0000-4000-8000-000000000002' })
      .expect(400);
  });
});
