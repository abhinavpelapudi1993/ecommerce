import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../product/ProductCard';
import type { Product } from '@ecommerce/data-client';

const mockProduct: Product = {
  id: 'p-001',
  sku: 'LAPTOP-001',
  name: 'Gaming Laptop',
  description: 'High-performance gaming laptop',
  price: 1299.99,
  stock: 50,
  createdAt: Date.now(),
  lastModifiedAt: Date.now(),
};

describe('ProductCard', () => {
  it('renders product name, sku, description, and price', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Gaming Laptop')).toBeInTheDocument();
    expect(screen.getByText('SKU: LAPTOP-001')).toBeInTheDocument();
    expect(screen.getByText('High-performance gaming laptop')).toBeInTheDocument();
    expect(screen.getByText('$1299.99')).toBeInTheDocument();
  });

  it('renders Buy Now button when onPurchase is provided', () => {
    const onPurchase = vi.fn();
    render(<ProductCard product={mockProduct} onPurchase={onPurchase} />);

    const button = screen.getByText('Buy Now');
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onPurchase).toHaveBeenCalledWith(mockProduct);
  });

  it('does not render Buy Now button when onPurchase is not provided', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.queryByText('Buy Now')).not.toBeInTheDocument();
  });
});
