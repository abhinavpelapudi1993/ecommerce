import type { Product } from '@ecommerce/data-client';
import { ProductCard } from './ProductCard';
import { Text } from '@clickhouse/click-ui';

interface ProductGridProps {
  products: Product[];
  onPurchase?: (product: Product) => void;
  loading?: boolean;
}

export function ProductGrid({ products, onPurchase, loading }: ProductGridProps) {
  if (loading) {
    return <Text color="muted">Loading products...</Text>;
  }

  if (products.length === 0) {
    return <Text color="muted">No products available.</Text>;
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onPurchase={onPurchase} />
      ))}
    </div>
  );
}
