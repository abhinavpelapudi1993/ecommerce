import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Text } from '@clickhouse/click-ui';
import {
  PageContainer,
  BillingDashboard,
  PurchaseTable,
} from '@ecommerce/ui-components';
import {
  useServices,
  createCreditStore,
  createPurchaseStore,
} from '@ecommerce/state-service';
import { useStore } from 'zustand';
import { ShipmentStatus } from '@ecommerce/data-client';
import type { Customer, Shipment } from '@ecommerce/data-client';

type Tab = 'billing' | 'purchases';

export function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const services = useServices();

  const creditStore = useMemo(() => createCreditStore(services), [services]);
  const purchaseStore = useMemo(() => createPurchaseStore(services), [services]);

  const credit = useStore(creditStore);
  const purchases = useStore(purchaseStore);

  const [tab, setTab] = useState<Tab>('billing');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [shipments, setShipments] = useState<Record<string, Shipment>>({});

  useEffect(() => {
    if (customerId) {
      credit.fetchBalance(customerId);
      purchases.fetchPurchases(customerId);
      services.customerClient.getCustomer(customerId).then(setCustomer).catch(() => {});
    }
  }, [customerId]);

  useEffect(() => {
    const ids = purchases.purchases
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
  }, [purchases.purchases]);

  const handleUpdateShipment = async (shipmentId: string, status: ShipmentStatus) => {
    try {
      const idempotencyKey = crypto.randomUUID();
      const updated = await services.shipmentClient.updateStatus(shipmentId, status, idempotencyKey);
      setShipments((prev) => ({ ...prev, [shipmentId]: updated }));
      // Refresh purchases since delivery auto-settles
      if (status === ShipmentStatus.Delivered && customerId) {
        purchases.fetchPurchases(customerId);
      }
    } catch {
      // silently fail — status will remain unchanged in UI
    }
  };

  if (!customerId) return <Text>No customer selected</Text>;

  const displayName = customer ? customer.name : `${customerId.substring(0, 8)}...`;

  return (
    <PageContainer
      title={displayName}
      actions={
        <Link to={`/customer/${customerId}/credit`}>
          <Button>Manage Credit</Button>
        </Link>
      }
    >
      {/* Customer info bar */}
      {customer && (
        <div style={{ marginBottom: 20, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Text color="muted" size="sm">{customer.email}</Text>
          <Text color="muted" size="sm">ID: {customer.id}</Text>
        </div>
      )}

      {/* Tabs */}
      <div style={tabBar}>
        <button
          onClick={() => setTab('billing')}
          style={tab === 'billing' ? activeTab : inactiveTab}
        >
          Billing
        </button>
        <button
          onClick={() => setTab('purchases')}
          style={tab === 'purchases' ? activeTab : inactiveTab}
        >
          Purchases ({purchases.purchases.length})
        </button>
      </div>

      {/* Tab content */}
      {tab === 'billing' && (
        <BillingDashboard
          customerName={displayName}
          balance={credit.balance}
          ledger={credit.ledger}
          loading={credit.loading}
        />
      )}

      {tab === 'purchases' && (
        <div>
          <PurchaseTable
            purchases={purchases.purchases}
            shipments={shipments}
            onUpdateShipment={handleUpdateShipment}
            onFetchTransactions={(id) => services.purchaseClient.getTransactions(id)}
          />
          {purchases.error && <Text color="danger">{purchases.error}</Text>}
        </div>
      )}

    </PageContainer>
  );
}

const tabBar: React.CSSProperties = {
  display: 'flex',
  gap: 0,
  borderBottom: '2px solid var(--click-color-border-default, #e0e0e0)',
  marginBottom: 24,
};

const baseTab: React.CSSProperties = {
  padding: '10px 20px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  color: 'inherit',
  borderBottom: '2px solid transparent',
  marginBottom: -2,
  transition: 'all 0.15s',
};

const activeTab: React.CSSProperties = {
  ...baseTab,
  borderBottomColor: '#FADB14',
  color: 'inherit',
};

const inactiveTab: React.CSSProperties = {
  ...baseTab,
  opacity: 0.6,
};
