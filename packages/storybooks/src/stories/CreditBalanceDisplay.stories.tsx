import type { Meta, StoryObj } from '@storybook/react';
import { CreditBalanceDisplay } from '@ecommerce/ui-components';

const meta: Meta<typeof CreditBalanceDisplay> = {
  title: 'Credit/CreditBalanceDisplay',
  component: CreditBalanceDisplay,
};

export default meta;
type Story = StoryObj<typeof CreditBalanceDisplay>;

export const WithBalance: Story = {
  args: { balance: 430.03 },
};

export const ZeroBalance: Story = {
  args: { balance: 0 },
};

export const Loading: Story = {
  args: { balance: null, loading: true },
};

export const NoData: Story = {
  args: { balance: null },
};
