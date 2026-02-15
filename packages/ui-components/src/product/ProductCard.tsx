import { Button, Title, Text } from '@clickhouse/click-ui';
import type { Product } from '@ecommerce/data-client';

interface ProductCardProps {
  product: Product;
  onPurchase?: (product: Product) => void;
}

export function ProductCard({ product, onPurchase }: ProductCardProps) {
  return (
    <div
      style={{
        padding: 16,
        border: '1px solid var(--click-color-border-default, #e0e0e0)',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <Title type="h4">{product.name}</Title>
      <Text color="muted" size="sm">
        SKU: {product.sku}
      </Text>
      <Text>{product.description}</Text>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'auto',
        }}
      >
        <Title type="h3">${product.price.toFixed(2)}</Title>
        {onPurchase && (
          <Button onClick={() => onPurchase(product)}>Buy Now</Button>
        )}
      </div>
    </div>
  );
}
