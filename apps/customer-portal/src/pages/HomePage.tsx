import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer, ProductSearch } from '@ecommerce/ui-components';
import { useServices } from '@ecommerce/state-service';
import type { Product } from '@ecommerce/data-client';

export function HomePage() {
  const navigate = useNavigate();
  const { productClient } = useServices();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    productClient
      .listProducts()
      .then(setProducts)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load products'))
      .finally(() => setLoading(false));
  }, [productClient]);

  const handlePurchase = (product: Product) => {
    navigate(`/product/${product.id}`);
  };

  if (error) {
    return <PageContainer title="Products"><p>Error: {error}</p></PageContainer>;
  }

  return (
    <PageContainer title="Products">
      <ProductSearch products={products} onPurchase={handlePurchase} loading={loading} />
    </PageContainer>
  );
}
