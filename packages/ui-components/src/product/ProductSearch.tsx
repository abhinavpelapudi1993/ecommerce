import { useState, useMemo } from 'react';
import { Text } from '@clickhouse/click-ui';
import type { Product } from '@ecommerce/data-client';
import { ProductCard } from './ProductCard';

interface ProductSearchProps {
  products: Product[];
  onPurchase?: (product: Product) => void;
  loading?: boolean;
}

export function ProductSearch({ products, onPurchase, loading }: ProductSearchProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q),
    );
  }, [products, query]);

  return (
    <div>
      {/* Search bar */}
      <div style={searchBarWrapper}>
        <span style={searchIcon}>&#128269;</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products by name, SKU, or description..."
          style={searchInput}
        />
        {query && (
          <button onClick={() => setQuery('')} style={clearButton}>
            &times;
          </button>
        )}
      </div>

      {/* Result count */}
      {query && (
        <Text color="muted" size="sm" style={{ display: 'block', marginBottom: 16 }}>
          {filtered.length} {filtered.length === 1 ? 'product' : 'products'} found
        </Text>
      )}

      {/* Grid */}
      {loading ? (
        <Text color="muted">Loading products...</Text>
      ) : filtered.length === 0 ? (
        <div style={emptyState}>
          <Text color="muted">
            {query ? `No products match "${query}"` : 'No products available.'}
          </Text>
        </div>
      ) : (
        <div style={grid}>
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} onPurchase={onPurchase} />
          ))}
        </div>
      )}
    </div>
  );
}

const searchBarWrapper: React.CSSProperties = {
  position: 'relative',
  marginBottom: 20,
};

const searchIcon: React.CSSProperties = {
  position: 'absolute',
  left: 14,
  top: '50%',
  transform: 'translateY(-50%)',
  fontSize: 16,
  pointerEvents: 'none',
};

const searchInput: React.CSSProperties = {
  width: '100%',
  padding: '12px 40px 12px 42px',
  borderRadius: 8,
  border: '1px solid var(--click-color-border-default, #ccc)',
  fontSize: 14,
  background: 'var(--click-color-bg-panel, #fff)',
  color: '#1a1a2e',
  outline: 'none',
  boxSizing: 'border-box',
};

const clearButton: React.CSSProperties = {
  position: 'absolute',
  right: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 20,
  color: '#999',
  padding: 0,
  lineHeight: 1,
};

const emptyState: React.CSSProperties = {
  padding: 48,
  textAlign: 'center',
  border: '1px dashed var(--click-color-border-default, #ccc)',
  borderRadius: 8,
};

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 16,
};
