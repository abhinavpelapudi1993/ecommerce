import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * Promo code flow E2E test.
 * Requires: postgres + redis + microservices running (docker-compose up).
 * Run with: npm run test:e2e
 */
describe('Promo Flow (e2e)', () => {
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

  it('should apply a valid promo code to a purchase', async () => {
    // 1. Create a promo code
    const promoCode = `TEST-${Date.now()}`;
    await request(app.getHttpServer())
      .post('/promos')
      .send({
        code: promoCode,
        discountType: 'percentage',
        discountValue: 10,
        maxUsages: 100,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      })
      .expect(201);

    // 2. Grant credit
    await request(app.getHttpServer())
      .post(`/credits/${customerId}/grant`)
      .send({ amount: 200, reason: 'Promo test credit' })
      .expect(201);

    // 3. Purchase with promo code
    const purchaseRes = await request(app.getHttpServer())
      .post('/purchases')
      .send({ customerId, productId, quantity: 1, promoCode })
      .expect(201);

    // 10% of $49.99 = $5.00 discount
    expect(purchaseRes.body.discountAmount).toBeCloseTo(5.0, 1);
    expect(purchaseRes.body.totalAmount).toBeCloseTo(44.99, 1);
  });

  it('should reject an invalid promo code', async () => {
    // Grant credit first
    await request(app.getHttpServer())
      .post(`/credits/${customerId}/grant`)
      .send({ amount: 200, reason: 'Invalid promo test' })
      .expect(201);

    // Purchase with invalid promo
    await request(app.getHttpServer())
      .post('/purchases')
      .send({ customerId, productId, quantity: 1, promoCode: 'INVALID-CODE-XYZ' })
      .expect(404);
  });

  it('should reject an expired promo code', async () => {
    // Create expired promo
    const expiredCode = `EXPIRED-${Date.now()}`;
    await request(app.getHttpServer())
      .post('/promos')
      .send({
        code: expiredCode,
        discountType: 'percentage',
        discountValue: 10,
        maxUsages: 100,
        expiresAt: new Date(Date.now() - 86400000).toISOString(),
      })
      .expect(201);

    // Grant credit
    await request(app.getHttpServer())
      .post(`/credits/${customerId}/grant`)
      .send({ amount: 200, reason: 'Expired promo test' })
      .expect(201);

    // Try to use expired promo
    await request(app.getHttpServer())
      .post('/purchases')
      .send({ customerId, productId, quantity: 1, promoCode: expiredCode })
      .expect(400);
  });
});
