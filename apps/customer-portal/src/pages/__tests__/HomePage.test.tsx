import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { HomePage } from '../HomePage';

// Mock the state-service module
vi.mock('@ecommerce/state-service', () => ({
  useServices: () => ({
    productClient: {
      listProducts: vi.fn().mockResolvedValue([
        {
          id: 'p-001',
          sku: 'LAPTOP-001',
          name: 'Gaming Laptop',
          description: 'A fast laptop',
          price: 1299.99,
          stock: 10,
          createdAt: Date.now(),
          lastModifiedAt: Date.now(),
        },
        {
          id: 'p-002',
          sku: 'MOUSE-001',
          name: 'ErgoMouse',
          description: 'Ergonomic mouse',
          price: 49.99,
          stock: 50,
          createdAt: Date.now(),
          lastModifiedAt: Date.now(),
        },
      ]),
    },
  }),
}));

describe('HomePage', () => {
  it('renders the Products title and displays products after loading', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Products')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Gaming Laptop')).toBeInTheDocument();
      expect(screen.getByText('ErgoMouse')).toBeInTheDocument();
    });
  });
});
