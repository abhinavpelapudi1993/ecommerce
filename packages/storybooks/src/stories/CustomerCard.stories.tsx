import type { Meta, StoryObj } from '@storybook/react';
import { CustomerCard } from '@ecommerce/ui-components';
import { mockCustomers } from '../mocks/customers';

const meta: Meta<typeof CustomerCard> = {
  title: 'Customer/CustomerCard',
  component: CustomerCard,
};

export default meta;
type Story = StoryObj<typeof CustomerCard>;

export const Default: Story = {
  args: {
    customer: mockCustomers[0],
  },
};

export const Clickable: Story = {
  args: {
    customer: mockCustomers[1],
    onSelect: (c) => alert(`Selected: ${c.name}`),
  },
};
