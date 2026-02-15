import type { Meta, StoryObj } from '@storybook/react';
import { ProductGrid } from '@ecommerce/ui-components';
import { mockProducts } from '../mocks/products';

const meta: Meta<typeof ProductGrid> = {
  title: 'Product/ProductGrid',
  component: ProductGrid,
};

export default meta;
type Story = StoryObj<typeof ProductGrid>;

export const Default: Story = {
  args: {
    products: mockProducts,
  },
};

export const WithPurchaseAction: Story = {
  args: {
    products: mockProducts,
    onPurchase: (p) => alert(`Buy: ${p.name} for $${p.price}`),
  },
};

export const Loading: Story = {
  args: {
    products: [],
    loading: true,
  },
};
