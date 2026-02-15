import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * Escrow flow E2E test.
 * Verifies that the company ledger correctly tracks escrow entries
 * through purchase, settlement, and cancellation flows.
 *
 * Requires: postgres + redis + microservices running (docker-compose up).
 * Run with: npm run test:e2e
 */
describe('Escrow Flow (e2e)', () => {
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

  it('should create escrow on purchase, release escrow and record sale on settlement', async () => {
    // 1. Grant credit
    await request(app.getHttpServer())
      .post(`/credits/${customerId}/grant`)
      .send({ amount: 200, reason: 'Escrow test credit' })
      .expect(201);

    // 2. Record company balance before purchase
    const balanceBefore = await request(app.getHttpServer())
      .get('/company/balance')
      .expect(200);

    const balanceBeforeValue = balanceBefore.body.balance;

    // 3. Purchase a product
    const purchaseRes = await request(app.getHttpServer())
      .post('/purchases')
      .send({ customerId, productId, quantity: 1 })
      .expect(201);

    const purchaseId = purchaseRes.body.id;
    const shipmentId = purchaseRes.body.shipmentId;

    // 4. Check company balance after purchase — escrow should add to balance
    const balanceAfterPurchase = await request(app.getHttpServer())
      .get('/company/balance')
      .expect(200);

    // Escrow entry (+49.99) should have increased the balance
    expect(balanceAfterPurchase.body.balance).toBeCloseTo(
      balanceBeforeValue + purchaseRes.body.totalAmount,
      1,
    );

    // Verify escrow entry exists in the ledger
    const escrowEntries = balanceAfterPurchase.body.ledger.filter(
      (e: any) => e.type === 'escrow' && e.referenceId === purchaseId,
    );
    expect(escrowEntries.length).toBeGreaterThanOrEqual(1);

    // 5. Deliver the shipment (triggers settlement)
    await request(app.getHttpServer())
      .patch(`/shipments/${shipmentId}`)
      .send({ status: 'shipped' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/shipments/${shipmentId}`)
      .send({ status: 'delivered' })
      .expect(200);

    // 6. Verify purchase is settled
    const settledPurchase = await request(app.getHttpServer())
      .get(`/purchases/${purchaseId}`)
      .expect(200);

    expect(settledPurchase.body.status).toBe('settled');

    // 7. Check company balance after settlement
    const balanceAfterSettle = await request(app.getHttpServer())
      .get('/company/balance')
      .expect(200);

    // Net effect: escrow(+49.99) + escrow_release(-49.99) + sale(+49.99) = +49.99
    expect(balanceAfterSettle.body.balance).toBeCloseTo(
      balanceBeforeValue + purchaseRes.body.totalAmount,
      1,
    );

    // Verify escrow_release and sale entries exist
    const releaseEntries = balanceAfterSettle.body.ledger.filter(
      (e: any) => e.type === 'escrow_release' && e.referenceId === purchaseId,
    );
    expect(releaseEntries.length).toBeGreaterThanOrEqual(1);

    const saleEntries = balanceAfterSettle.body.ledger.filter(
      (e: any) => e.type === 'sale' && e.referenceId === purchaseId,
    );
    expect(saleEntries.length).toBeGreaterThanOrEqual(1);
  });

  it('should create escrow on purchase and release escrow on cancellation (no sale)', async () => {
    // 1. Grant credit
    await request(app.getHttpServer())
      .post(`/credits/${customerId}/grant`)
      .send({ amount: 200, reason: 'Escrow cancel test credit' })
      .expect(201);

    // 2. Record company balance before purchase
    const balanceBefore = await request(app.getHttpServer())
      .get('/company/balance')
      .expect(200);

    const balanceBeforeValue = balanceBefore.body.balance;

    // 3. Purchase a product
    const purchaseRes = await request(app.getHttpServer())
      .post('/purchases')
      .send({ customerId, productId, quantity: 1 })
      .expect(201);

    const purchaseId = purchaseRes.body.id;

    // 4. Cancel the order
    const cancelRes = await request(app.getHttpServer())
      .post(`/purchases/${purchaseId}/cancel`)
      .send({ customerId })
      .expect(201);

    expect(cancelRes.body.status).toBe('cancelled');

    // 5. Check company balance after cancellation
    const balanceAfterCancel = await request(app.getHttpServer())
      .get('/company/balance')
      .expect(200);

    // Net effect: escrow(+49.99) + escrow_release(-49.99) = 0 change
    expect(balanceAfterCancel.body.balance).toBeCloseTo(balanceBeforeValue, 1);

    // Verify both escrow and escrow_release entries exist for this purchase
    const escrowEntries = balanceAfterCancel.body.ledger.filter(
      (e: any) => e.type === 'escrow' && e.referenceId === purchaseId,
    );
    const releaseEntries = balanceAfterCancel.body.ledger.filter(
      (e: any) => e.type === 'escrow_release' && e.referenceId === purchaseId,
    );

    expect(escrowEntries.length).toBeGreaterThanOrEqual(1);
    expect(releaseEntries.length).toBeGreaterThanOrEqual(1);

    // Verify NO sale entry was created for this cancelled purchase
    const saleEntries = balanceAfterCancel.body.ledger.filter(
      (e: any) => e.type === 'sale' && e.referenceId === purchaseId,
    );
    expect(saleEntries.length).toBe(0);
  });
});
