import { useEffect, useState } from 'react';
import { Title, Text } from '@clickhouse/click-ui';
import { PageContainer } from '@ecommerce/ui-components';
import { useServices } from '@ecommerce/state-service';
import { useCustomer } from '../customer-context';
import type { Customer, Address } from '@ecommerce/data-client';

function AddressBlock({ label, address }: { label: string; address: Address }) {
  return (
    <div>
      <Text size="sm" color="muted" style={{ display: 'block', marginBottom: 4 }}>
        {label}
      </Text>
      <div
        style={{
          padding: '12px 16px',
          border: '1px solid var(--click-color-border-default, #e0e0e0)',
          borderRadius: 8,
        }}
      >
        <Text style={{ display: 'block' }}>{address.line1}</Text>
        {address.line2 && <Text style={{ display: 'block' }}>{address.line2}</Text>}
        <Text style={{ display: 'block' }}>
          {address.city}, {address.state} {address.postalCode}
        </Text>
        <Text style={{ display: 'block' }}>{address.country}</Text>
      </div>
    </div>
  );
}

export function AccountPage() {
  const { customer: sessionCustomer } = useCustomer();
  const { customerClient } = useServices();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionCustomer) return;
    customerClient
      .getCustomer(sessionCustomer.id)
      .then(setCustomer)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionCustomer, customerClient]);

  if (!sessionCustomer) return null;

  if (loading) {
    return (
      <PageContainer title="My Account">
        <Text color="muted">Loading...</Text>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="My Account">
      <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <Title type="h3" style={{ marginBottom: 12 }}>Profile</Title>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr',
              gap: '8px 16px',
              alignItems: 'baseline',
            }}
          >
            <Text color="muted" size="sm">Name</Text>
            <Text>{sessionCustomer.name}</Text>
            <Text color="muted" size="sm">Email</Text>
            <Text>{sessionCustomer.email}</Text>
            <Text color="muted" size="sm">Customer ID</Text>
            <Text size="sm" style={{ fontFamily: 'monospace' }}>{sessionCustomer.id}</Text>
          </div>
        </div>

        {customer && (
          <div>
            <Title type="h3" style={{ marginBottom: 12 }}>Addresses</Title>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <AddressBlock label="Billing Address" address={customer.billingAddress} />
              <AddressBlock label="Shipping Address" address={customer.shippingAddress} />
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
