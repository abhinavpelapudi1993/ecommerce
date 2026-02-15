import { useEffect, useMemo, useState } from 'react';
import { PageContainer, PurchaseTable, RefundDialog } from '@ecommerce/ui-components';
import { useServices, createPurchaseStore } from '@ecommerce/state-service';
import { useStore } from 'zustand';
import { useCustomer } from '../customer-context';
import type { Purchase, Shipment } from '@ecommerce/data-client';
import { RefundRequestType } from '@ecommerce/data-client';

export function PurchaseHistoryPage() {
  const { customer } = useCustomer();
  const services = useServices();
  const store = useMemo(() => createPurchaseStore(services), [services]);
  const { purchases, loading, fetchPurchases, cancelPurchase } = useStore(store);
  const [shipments, setShipments] = useState<Record<string, Shipment>>({});
  const [refundTarget, setRefundTarget] = useState<Purchase | null>(null);
  const [refundType, setRefundType] = useState<'return' | 'refund'>('refund');

  useEffect(() => {
    if (customer) fetchPurchases(customer.id);
  }, [fetchPurchases, customer]);

  useEffect(() => {
    const ids = purchases
      .map((p) => p.shipmentId)
      .filter((id): id is string => !!id && !shipments[id]);

    if (ids.length === 0) return;

    Promise.allSettled(
      ids.map((id) => services.shipmentClient.getShipment(id)),
    ).then((results) => {
      const fetched: Record<string, Shipment> = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') fetched[ids[i]] = r.value;
      });
      setShipments((prev) => ({ ...prev, ...fetched }));
    });
  }, [purchases]);

  const handleCancel = async (purchase: Purchase) => {
    if (!customer) return;
    if (!window.confirm(`Cancel order for ${purchase.quantity}x ${purchase.productName}? Your credit will be refunded.`)) return;
    try {
      await cancelPurchase(purchase.id, customer.id);
    } catch {
      // error is stored in the store
    }
  };

  const handleRefundRequest = async (
    purchaseId: string,
    data: { amount?: number; reason: string },
  ) => {
    if (!customer) return;
    await services.refundRequestClient.createRequest(purchaseId, {
      customerId: customer.id,
      type: refundType === 'return' ? RefundRequestType.Return : RefundRequestType.Refund,
      reason: data.reason,
      requestedAmount: data.amount,
    });
    fetchPurchases(customer.id);
  };

  return (
    <PageContainer title="My Purchases">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <PurchaseTable
          purchases={purchases}
          shipments={shipments}
          onCancel={handleCancel}
          onReturn={(p) => { setRefundType('return'); setRefundTarget(p); }}
          onRefund={(p) => { setRefundType('refund'); setRefundTarget(p); }}
        />
      )}

      {refundTarget && (
        <RefundDialog
          purchase={refundTarget}
          open={true}
          mode="request"
          refundType={refundType}
          onClose={() => setRefundTarget(null)}
          onSubmit={handleRefundRequest}
        />
      )}
    </PageContainer>
  );
}
