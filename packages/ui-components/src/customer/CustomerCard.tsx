import { Text, Title } from '@clickhouse/click-ui';
import type { Customer } from '@ecommerce/data-client';

interface CustomerCardProps {
  customer: Customer;
  onSelect?: (customer: Customer) => void;
}

export function CustomerCard({ customer, onSelect }: CustomerCardProps) {
  const handleClick = () => onSelect?.(customer);

  return (
    <div
      onClick={handleClick}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onSelect) handleClick();
      }}
      style={{
        padding: 16,
        border: '1px solid var(--click-color-border-default, #e0e0e0)',
        borderRadius: 8,
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'border-color 0.15s',
      }}
    >
      <Title type="h4">{customer.name}</Title>
      <Text color="muted">{customer.email}</Text>
      <div style={{ marginTop: 8 }}>
        <Text size="sm" color="muted">
          {customer.shippingAddress.line1}, {customer.shippingAddress.city},{' '}
          {customer.shippingAddress.state}
        </Text>
      </div>
    </div>
  );
}
