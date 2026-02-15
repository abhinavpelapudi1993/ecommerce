import type { Meta, StoryObj } from '@storybook/react';
import { RefundDialog } from '@ecommerce/ui-components';
import { mockPurchases } from '../mocks/purchases';

const meta: Meta<typeof RefundDialog> = {
  title: 'Purchase/RefundDialog',
  component: RefundDialog,
};

export default meta;
type Story = StoryObj<typeof RefundDialog>;

export const FullRefund: Story = {
  args: {
    purchase: mockPurchases[0], // $99.98, no refunds yet
    open: true,
    onClose: () => {},
    onRefund: async (id, amt, reason) => {
      alert(`Refunded $${amt} for ${id}: ${reason}`);
    },
  },
};

export const PartialRefund: Story = {
  args: {
    purchase: mockPurchases[1], // $1169.99, already $200 refunded
    open: true,
    onClose: () => {},
    onRefund: async (id, amt, reason) => {
      alert(`Refunded $${amt} for ${id}: ${reason}`);
    },
  },
};
