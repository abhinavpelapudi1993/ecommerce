import type { Meta, StoryObj } from '@storybook/react';
import { PurchaseTable } from '@ecommerce/ui-components';
import { mockPurchases } from '../mocks/purchases';

const meta: Meta<typeof PurchaseTable> = {
  title: 'Purchase/PurchaseTable',
  component: PurchaseTable,
};

export default meta;
type Story = StoryObj<typeof PurchaseTable>;

export const Default: Story = {
  args: {
    purchases: mockPurchases,
  },
};

export const WithRefundAction: Story = {
  args: {
    purchases: mockPurchases,
    onRefund: (p) => alert(`Refund: ${p.productName}`),
  },
};

export const Empty: Story = {
  args: {
    purchases: [],
  },
};
