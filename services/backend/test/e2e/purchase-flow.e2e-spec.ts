import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * Full purchase flow E2E test.
 * Requires: postgres + redis running (docker-compose up), mock-api running on :3001.
 * Run with: npm run test:e2e
 */
describe('Purchase Flow (e2e)', () => {
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

  it('full flow: grant credit → purchase → list → refund → verify balance', async () => {
    // 1. Grant credit
    const grantRes = await request(app.getHttpServer())
      .post(`/credits/${customerId}/grant`)
      .send({ amount: 200, reason: 'E2E test credit' })
      .expect(201);

    expect(grantRes.body.balance).toBeGreaterThanOrEqual(200);

    // 2. Purchase a product
    const purchaseRes = await request(app.getHttpServer())
      .post('/purchases')
      .send({ customerId, productId, quantity: 1 })
      .expect(201);

    const purchaseId = purchaseRes.body.id;
    expect(purchaseRes.body.productSku).toBe('MOUSE-ERGO-X');
    expect(purchaseRes.body.status).toBe('completed');
    expect(purchaseRes.body.totalAmount).toBe(49.99);

    // 3. Check balance was deducted
    const balanceRes = await request(app.getHttpServer())
      .get(`/credits/${customerId}/balance`)
      .expect(200);

    expect(balanceRes.body.balance).toBeLessThan(200);

    // 4. List purchases for customer
    const listRes = await request(app.getHttpServer())
      .get(`/purchases?customerId=${customerId}`)
      .expect(200);

    expect(listRes.body.purchases.length).toBeGreaterThanOrEqual(1);

    // 5. Partial refund
    const refundRes = await request(app.getHttpServer())
      .post(`/purchases/${purchaseId}/refund`)
      .send({ amount: 20, reason: 'Partial refund test' })
      .expect(201);

    expect(refundRes.body.status).toBe('partially_refunded');
    expect(refundRes.body.refundedAmount).toBe(20);

    // 6. Verify balance went back up
    const finalBalance = await request(app.getHttpServer())
      .get(`/credits/${customerId}/balance`)
      .expect(200);

    expect(finalBalance.body.balance).toBeGreaterThan(balanceRes.body.balance);
  });

  it('should fail purchase with insufficient credit', async () => {
    // Try to buy an expensive item without enough credit
    await request(app.getHttpServer())
      .post('/purchases')
      .send({
        customerId,
        productId: 'a1b2c3d4-e5f6-4a1b-8c2d-1a2b3c4d5e01', // $1299.99 laptop
        quantity: 10,
      })
      .expect(400);
  });
});
